import Anthropic from '@anthropic-ai/sdk';
import type { LLMMessage, LLMResponse } from '../../types.js';
import { LLMProvider } from './base.js';

export class AnthropicProvider extends LLMProvider {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model: string = 'claude-3-5-sonnet-20241022') {
    super();
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  getModel(): string {
    return this.model;
  }

  getProvider(): string {
    return 'anthropic';
  }

  async complete(messages: LLMMessage[], options?: Record<string, unknown>): Promise<LLMResponse> {
    const systemMessages = messages.filter((m) => m.role === 'system');
    const nonSystemMessages = messages.filter((m) => m.role !== 'system');

    const systemPrompt = systemMessages.map((m) => m.content).join('\n');

    const response = await this.client.messages.create({
      model: this.model,
      system: systemPrompt || undefined,
      messages: nonSystemMessages.map((m) => ({
        role: m.role === 'tool' ? 'assistant' : m.role,
        content: m.content,
      })) as Anthropic.MessageParam[],
      max_tokens: (options?.maxTokens as number) ?? 4096,
      temperature: (options?.temperature as number) ?? 0.7,
    });

    const content = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as Anthropic.TextBlock).text)
      .join('\n');

    const toolUseBlocks = response.content.filter(
      (block) => block.type === 'tool_use',
    ) as Anthropic.ToolUseBlock[];

    const toolCalls = toolUseBlocks.map((block) => ({
      name: block.name,
      arguments: block.input as Record<string, unknown>,
    }));

    return {
      content,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: response.usage
        ? {
            promptTokens: response.usage.input_tokens,
            completionTokens: response.usage.output_tokens,
            totalTokens: response.usage.input_tokens + response.usage.output_tokens,
          }
        : undefined,
      finishReason:
        response.stop_reason === 'end_turn'
          ? 'stop'
          : response.stop_reason === 'tool_use'
            ? 'tool_calls'
            : 'stop',
    };
  }

  async *completeStream(
    messages: LLMMessage[],
    options?: Record<string, unknown>,
  ): AsyncIterable<LLMResponse> {
    const systemMessages = messages.filter((m) => m.role === 'system');
    const nonSystemMessages = messages.filter((m) => m.role !== 'system');

    const systemPrompt = systemMessages.map((m) => m.content).join('\n');

    const stream = await this.client.messages.create({
      model: this.model,
      system: systemPrompt || undefined,
      messages: nonSystemMessages.map((m) => ({
        role: m.role === 'tool' ? 'assistant' : m.role,
        content: m.content,
      })) as Anthropic.MessageParam[],
      max_tokens: (options?.maxTokens as number) ?? 4096,
      temperature: (options?.temperature as number) ?? 0.7,
      stream: true,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        yield {
          content: event.delta.text,
          finishReason: undefined,
        };
      }
      if (event.type === 'message_delta') {
        yield {
          content: '',
          finishReason:
            event.delta.stop_reason === 'end_turn'
              ? 'stop'
              : event.delta.stop_reason === 'tool_use'
                ? 'tool_calls'
                : undefined,
        };
      }
    }
  }
}
