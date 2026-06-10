import type { LLMMessage } from '../types.js';
import { MemoryProvider } from './base.js';

interface VectorEntry {
  id: number;
  message: LLMMessage;
  embedding: number[];
  timestamp: number;
}

export class VectorMemory extends MemoryProvider {
  private entries: VectorEntry[] = [];
  private nextId: number = 1;
  private embedder: (text: string) => Promise<number[]>;

  constructor(embedder: (text: string) => Promise<number[]>) {
    super();
    this.embedder = embedder;
  }

  async add(messages: LLMMessage[]): Promise<void> {
    const timestamp = Date.now();
    for (const message of messages) {
      const embedding = await this.embedder(message.content);
      this.entries.push({
        id: this.nextId++,
        message,
        embedding,
        timestamp,
      });
    }
  }

  async getHistory(): Promise<LLMMessage[]> {
    return this.entries
      .slice()
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((e) => e.message);
  }

  async clear(): Promise<void> {
    this.entries = [];
    this.nextId = 1;
  }

  async search(query: string, limit: number = 5): Promise<LLMMessage[]> {
    if (this.entries.length === 0) return [];

    const queryEmbedding = await this.embedder(query);
    const scored = this.entries.map((entry) => ({
      entry,
      score: this.cosineSimilarity(queryEmbedding, entry.embedding),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map((s) => s.entry.message);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }
}
