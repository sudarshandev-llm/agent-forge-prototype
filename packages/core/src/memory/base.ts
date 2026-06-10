import type { LLMMessage } from '../types.js';

export abstract class MemoryProvider {
  abstract add(messages: LLMMessage[]): Promise<void>;

  abstract getHistory(): Promise<LLMMessage[]>;

  abstract clear(): Promise<void>;

  abstract search(query: string, limit?: number): Promise<LLMMessage[]>;
}
