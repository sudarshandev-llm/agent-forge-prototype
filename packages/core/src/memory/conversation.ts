import type { LLMMessage } from '../types.js';
import { MemoryProvider } from './base.js';

export class SlidingWindowConversationMemory extends MemoryProvider {
  private messages: LLMMessage[] = [];
  private maxMessages: number;

  constructor(maxMessages: number = 50) {
    super();
    this.maxMessages = maxMessages;
  }

  async add(incoming: LLMMessage[]): Promise<void> {
    this.messages.push(...incoming);
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }
  }

  async getHistory(): Promise<LLMMessage[]> {
    return [...this.messages];
  }

  async clear(): Promise<void> {
    this.messages = [];
  }

  async search(query: string, limit: number = 5): Promise<LLMMessage[]> {
    const lowerQuery = query.toLowerCase();
    const results = this.messages.filter((m) => m.content.toLowerCase().includes(lowerQuery));
    return results.slice(-limit);
  }
}
