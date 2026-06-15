import { EventEmitter } from 'eventemitter3';
import { nanoid } from 'nanoid';
import pRetry from 'p-retry';
import type {
  AgentConfig,
  AgentRunResult,
  ExecutionStep,
  LLMMessage,
  LLMResponse,
} from '../types.js';
import { LLMProvider } from '../llm/providers/base.js';
import { MemoryProvider } from '../memory/base.js';
import { ToolRegistry } from '../tools/registry.js';

export interface AgentEvents {
  step: (step: ExecutionStep) => void;
  error: (error: Error) => void;
  done: (result: AgentRunResult) => void;
}

export class Agent extends EventEmitter<AgentEvents> {
  private config: AgentConfig;
  private provider: LLMProvider;
  private memory: MemoryProvider;
  private tools: ToolRegistry;

  constructor(
    config: AgentConfig,
    provider: LLMProvider,
    memory: MemoryProvider,
    tools: ToolRegistry,
  ) {
    super();
    this.config = config;
    this.provider = provider;
    this.memory = memory;
    this.tools = tools;
  }

  async run(
    input: string,
    options?: { stream?: boolean; maxSteps?: number },
  ): Promise<AgentRunResult> {
    const startTime = Date.now();
    const runId = nanoid();
    const maxSteps = options?.maxSteps ?? 10;
    const steps: ExecutionStep[] = [];
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalTokens = 0;

    const history = await this.memory.getHistory();

    const buildMessages = (additionalContext?: string): LLMMessage[] => {
      const systemMsg: LLMMessage = {
        role: 'system',
        content: this.config.systemPrompt,
      };
      const userMsg: LLMMessage = {
        role: 'user',
        content: additionalContext ? `${input}\n\n${additionalContext}` : input,
      };
      return [systemMsg, ...history, userMsg];
    };

    let iteration = 0;

    const attempt = async (): Promise<AgentRunResult> => {
      const toolDefs = (this.config.tools ?? [])
        .map((name) => this.tools.get(name))
        .filter(Boolean) as Array<{
        name: string;
        description: string;
        parameters: Record<string, unknown>;
      }>;

      const openAiTools = toolDefs.map((t) => ({
        type: 'function' as const,
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters as Record<string, unknown>,
        },
      }));

      let messages = buildMessages();

      while (iteration < maxSteps) {
        const stepId = nanoid();

        const step: ExecutionStep = {
          id: stepId,
          type: 'thought',
          content: '',
          timestamp: Date.now(),
        };

        try {
          const llmOptions: Record<string, unknown> = {
            temperature: this.config.temperature,
            maxTokens: this.config.maxTokens,
          };

          if (toolDefs.length > 0) {
            llmOptions.tools = openAiTools;
          }

          let response: LLMResponse;

          if (options?.stream) {
            response = await this.streamComplete(messages, llmOptions, steps, stepId);
          } else {
            response = await this.provider.complete(messages, llmOptions);
          }

          if (response.usage) {
            totalPromptTokens += response.usage.promptTokens;
            totalCompletionTokens += response.usage.completionTokens;
            totalTokens += response.usage.totalTokens;
          }

          const thoughtStep: ExecutionStep = {
            id: stepId,
            type: 'thought',
            content: response.content,
            timestamp: Date.now(),
          };
          steps.push(thoughtStep);
          this.emit('step', thoughtStep);

          if (response.toolCalls && response.toolCalls.length > 0) {
            for (const tc of response.toolCalls) {
              const actionStep: ExecutionStep = {
                id: nanoid(),
                type: 'action',
                content: `Calling tool "${tc.name}" with arguments: ${JSON.stringify(tc.arguments)}`,
                timestamp: Date.now(),
                metadata: { tool: tc.name, arguments: tc.arguments },
              };
              steps.push(actionStep);
              this.emit('step', actionStep);

              try {
                const result = await this.tools.execute(tc.name, tc.arguments);

                const observationStep: ExecutionStep = {
                  id: nanoid(),
                  type: 'observation',
                  content: `Tool "${tc.name}" returned: ${JSON.stringify(result)}`,
                  timestamp: Date.now(),
                  metadata: { tool: tc.name, result },
                };
                steps.push(observationStep);
                this.emit('step', observationStep);

                messages = [
                  ...messages,
                  {
                    role: 'assistant',
                    content: response.content,
                  },
                  {
                    role: 'tool',
                    content: JSON.stringify(result),
                    toolCallId: tc.name,
                    name: tc.name,
                  },
                ];
              } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                const errorStep: ExecutionStep = {
                  id: nanoid(),
                  type: 'observation',
                  content: `Tool "${tc.name}" failed: ${errorMessage}`,
                  timestamp: Date.now(),
                  metadata: { tool: tc.name, error: errorMessage },
                };
                steps.push(errorStep);
                this.emit('step', errorStep);

                messages = [
                  ...messages,
                  {
                    role: 'assistant',
                    content: response.content,
                  },
                  {
                    role: 'tool',
                    content: `Error: ${errorMessage}`,
                    toolCallId: tc.name,
                    name: tc.name,
                  },
                ];
              }
            }
            iteration++;
            continue;
          }

          const resultStep: ExecutionStep = {
            id: nanoid(),
            type: 'result',
            content: response.content,
            timestamp: Date.now(),
          };
          steps.push(resultStep);
          this.emit('step', resultStep);

          await this.memory.add([
            { role: 'user', content: input },
            { role: 'assistant', content: response.content },
          ]);

          const duration = Date.now() - startTime;
          const result: AgentRunResult = {
            id: runId,
            agentId: this.config.id,
            output: response.content,
            steps,
            usage: {
              promptTokens: totalPromptTokens,
              completionTokens: totalCompletionTokens,
              totalTokens,
            },
            duration,
            status: 'completed',
          };

          this.emit('done', result);
          return result;
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          throw new Error(`Agent run failed at iteration ${iteration}: ${errorMessage}`);
        }
      }

      const duration = Date.now() - startTime;
      const result: AgentRunResult = {
        id: runId,
        agentId: this.config.id,
        output:
          steps
            .filter((s) => s.type === 'result')
            .map((s) => s.content)
            .join('\n') || 'Max iterations reached without final result',
        steps,
        usage: {
          promptTokens: totalPromptTokens,
          completionTokens: totalCompletionTokens,
          totalTokens,
        },
        duration,
        status: 'completed',
      };

      this.emit('done', result);
      return result;
    };

    try {
      return await pRetry(attempt, {
        retries: 2,
        onFailedAttempt: (error) => {
          this.emit('error', error);
        },
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const duration = Date.now() - startTime;
      const failedResult: AgentRunResult = {
        id: runId,
        agentId: this.config.id,
        output: '',
        steps,
        usage: {
          promptTokens: totalPromptTokens,
          completionTokens: totalCompletionTokens,
          totalTokens,
        },
        duration,
        status: 'failed',
        error: errorMessage,
      };
      this.emit('done', failedResult);
      return failedResult;
    }
  }

  private async streamComplete(
    messages: LLMMessage[],
    options: Record<string, unknown>,
    steps: ExecutionStep[],
    stepId: string,
  ): Promise<LLMResponse> {
    let fullContent = '';

    for await (const chunk of this.provider.completeStream(messages, options)) {
      if (chunk.content) {
        fullContent += chunk.content;
      }
      if (chunk.toolCalls && chunk.toolCalls.length > 0) {
        return {
          content: fullContent,
          toolCalls: chunk.toolCalls,
          finishReason: 'tool_calls',
        };
      }
    }

    return {
      content: fullContent,
      finishReason: 'stop',
    };
  }

  getConfig(): AgentConfig {
    return { ...this.config };
  }

  updateConfig(partial: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...partial };
  }
}
