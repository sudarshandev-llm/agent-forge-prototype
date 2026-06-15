import OpenAI from 'openai';
import type { LLMMessage, LLMResponse } from '../../types.js';
import { LLMProvider } from './base.js';

export class OpenAIProvider extends LLMProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4o') {
    super();
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  getModel(): string {
    return this.model;
  }

  getProvider(): string {
    return 'openai';
  }

  async complete(messages: LLMMessage[], options?: Record<string, unknown>): Promise<LLMResponse> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: messages.map((m) => ({
        role: m.role === 'tool' ? 'tool' : m.role,
        content: m.content,
        tool_call_id: m.toolCallId,
        name: m.name,
      })) as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      temperature: (options?.temperature as number) ?? 0.7,
      max_tokens: (options?.maxTokens as number) ?? 4096,
      ...(options?.tools
        ? { tools: options.tools as OpenAI.Chat.Completions.ChatCompletionTool[] }
        : {}),
    });

    const choice = response.choices[0];
    if (!choice) {
      return {
        content: '',
        finishReason: 'error',
      };
    }

    const toolCalls = choice.message.tool_calls?.map((tc) => ({
      name: tc.function.name,
      arguments: JSON.parse(tc.function.arguments) as Record<string, unknown>,
    }));

    return {
      content: choice.message.content ?? '',
      toolCalls,
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
      finishReason: (choice.finish_reason as LLMResponse['finishReason']) ?? 'stop',
    };
  }

  async *completeStream(
    messages: LLMMessage[],
    options?: Record<string, unknown>,
  ): AsyncIterable<LLMResponse> {
    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages: messages.map((m) => ({
        role: m.role === 'tool' ? 'tool' : m.role,
        content: m.content,
        tool_call_id: m.toolCallId,
        name: m.name,
      })) as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      temperature: (options?.temperature as number) ?? 0.7,
      max_tokens: (options?.maxTokens as number) ?? 4096,
      stream: true,
      ...(options?.tools
        ? { tools: options.tools as OpenAI.Chat.Completions.ChatCompletionTool[] }
        : {}),
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (!delta) continue;

      const toolCalls = delta.tool_calls
        ?.filter((tc) => tc.function?.name)
        .map((tc) => ({
          name: tc.function!.name!,
          arguments: tc.function?.arguments
            ? (JSON.parse(tc.function.arguments) as Record<string, unknown>)
            : {},
        }));

      yield {
        content: delta.content ?? '',
        toolCalls: toolCalls && toolCalls.length > 0 ? toolCalls : undefined,
        finishReason: (chunk.choices[0]?.finish_reason as LLMResponse['finishReason']) ?? undefined,
      };
    }
  }
}
