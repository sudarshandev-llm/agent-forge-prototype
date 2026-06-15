import type { LLMMessage, LLMResponse } from '../../types.js';

export abstract class LLMProvider {
  abstract complete(
    messages: LLMMessage[],
    options?: Record<string, unknown>,
  ): Promise<LLMResponse>;

  abstract completeStream(
    messages: LLMMessage[],
    options?: Record<string, unknown>,
  ): AsyncIterable<LLMResponse>;

  abstract getModel(): string;

  abstract getProvider(): string;
}
