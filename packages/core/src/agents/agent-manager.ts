import { nanoid } from 'nanoid';
import type { AgentConfig, AgentRunResult } from '../types.js';
import { Agent } from './agent.js';
import { OpenAIProvider } from '../llm/providers/openai.js';
import { AnthropicProvider } from '../llm/providers/anthropic.js';
import { GoogleProvider } from '../llm/providers/google.js';
import { SlidingWindowConversationMemory } from '../memory/conversation.js';
import { VectorMemory } from '../memory/vector.js';
import { ToolRegistry } from '../tools/registry.js';
import { LLMProvider } from '../llm/providers/base.js';
import { MemoryProvider } from '../memory/base.js';

export class AgentManager {
  private agents: Map<string, Agent> = new Map();
  private toolRegistry: ToolRegistry;

  constructor(toolRegistry?: ToolRegistry) {
    this.toolRegistry = toolRegistry ?? new ToolRegistry();
  }

  create(config: AgentConfig): Agent {
    if (this.agents.has(config.id)) {
      throw new Error(`Agent with id "${config.id}" already exists`);
    }

    const provider = this.createProvider(config);
    const memory = this.createMemory(config);
    const agent = new Agent(config, provider, memory, this.toolRegistry);

    this.agents.set(config.id, agent);
    return agent;
  }

  get(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  list(): Agent[] {
    return Array.from(this.agents.values());
  }

  delete(id: string): boolean {
    return this.agents.delete(id);
  }

  async run(
    config: Omit<AgentConfig, 'id'>,
    input: string,
  ): Promise<AgentRunResult> {
    const id = nanoid();
    const fullConfig: AgentConfig = { ...config, id };
    const agent = this.create(fullConfig);
    return agent.run(input);
  }

  private createProvider(config: AgentConfig): LLMProvider {
    const apiKey = this.resolveApiKey(config.provider);

    switch (config.provider) {
      case 'openai':
        return new OpenAIProvider(apiKey, config.model);
      case 'anthropic':
        return new AnthropicProvider(apiKey, config.model);
      case 'google':
        return new GoogleProvider(apiKey, config.model);
      default:
        return new OpenAIProvider(apiKey, config.model);
    }
  }

  private createMemory(config: AgentConfig): MemoryProvider {
    const memoryConfig = config.memory;

    if (!memoryConfig) {
      return new SlidingWindowConversationMemory(50);
    }

    switch (memoryConfig.type) {
      case 'conversation':
        return new SlidingWindowConversationMemory(memoryConfig.maxMessages ?? 50);
      case 'vector':
        return new VectorMemory(async (text: string) => {
          const embedding = new Array(1536).fill(0);
          for (let i = 0; i < Math.min(text.length, 1536); i++) {
            embedding[i] = text.charCodeAt(i) / 255;
          }
          return embedding;
        });
      case 'both':
        return new SlidingWindowConversationMemory(memoryConfig.maxMessages ?? 50);
      default:
        return new SlidingWindowConversationMemory(50);
    }
  }

  private resolveApiKey(provider: string): string {
    switch (provider) {
      case 'openai':
        return process.env.OPENAI_API_KEY ?? 'sk-placeholder';
      case 'anthropic':
        return process.env.ANTHROPIC_API_KEY ?? 'sk-ant-placeholder';
      case 'google':
        return process.env.GOOGLE_API_KEY ?? 'placeholder';
      case 'groq':
        return process.env.GROQ_API_KEY ?? 'gsk-placeholder';
      default:
        return process.env.OPENAI_API_KEY ?? 'sk-placeholder';
    }
  }
}
