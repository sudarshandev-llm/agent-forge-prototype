import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Agent } from '../src/agents/agent.js';
import { LLMProvider } from '../src/llm/providers/base.js';
import type { LLMMessage, LLMResponse, AgentConfig } from '../src/types.js';
import { SlidingWindowConversationMemory } from '../src/memory/conversation.js';
import { ToolRegistry } from '../src/tools/registry.js';

class MockLLMProvider extends LLMProvider {
  private model: string;
  public completeMock = vi.fn();

  constructor(model: string = 'mock-model') {
    super();
    this.model = model;
  }

  getModel(): string {
    return this.model;
  }

  getProvider(): string {
    return 'mock';
  }

  async complete(
    _messages: LLMMessage[],
    _options?: Record<string, unknown>,
  ): Promise<LLMResponse> {
    return this.completeMock(_messages, _options);
  }

  async *completeStream(
    _messages: LLMMessage[],
    _options?: Record<string, unknown>,
  ): AsyncIterable<LLMResponse> {
    const result = await this.complete(_messages, _options);
    yield result;
  }
}

function createTestConfig(overrides: Partial<AgentConfig> = {}): AgentConfig {
  return {
    id: 'test-agent-1',
    name: 'Test Agent',
    description: 'A test agent',
    systemPrompt: 'You are a helpful assistant.',
    model: 'gpt-4o',
    provider: 'openai',
    temperature: 0.7,
    maxTokens: 4096,
    ...overrides,
  };
}

describe('Agent', () => {
  let mockProvider: MockLLMProvider;
  let memory: SlidingWindowConversationMemory;
  let tools: ToolRegistry;

  beforeEach(() => {
    mockProvider = new MockLLMProvider();
    memory = new SlidingWindowConversationMemory(50);
    tools = new ToolRegistry();
  });

  describe('creation', () => {
    it('should create an agent with valid config', () => {
      const config = createTestConfig();
      const agent = new Agent(config, mockProvider, memory, tools);
      expect(agent).toBeInstanceOf(Agent);
      expect(agent.getConfig()).toEqual(config);
    });

    it('should return the correct config via getConfig', () => {
      const config = createTestConfig({ name: 'Custom Agent' });
      const agent = new Agent(config, mockProvider, memory, tools);
      expect(agent.getConfig().name).toBe('Custom Agent');
    });

    it('should update config via updateConfig', () => {
      const config = createTestConfig();
      const agent = new Agent(config, mockProvider, memory, tools);
      agent.updateConfig({ temperature: 0.2 });
      expect(agent.getConfig().temperature).toBe(0.2);
    });
  });

  describe('ReAct loop', () => {
    it('should return a result with output for simple completion', async () => {
      mockProvider.completeMock.mockResolvedValue({
        content: 'Hello, world!',
        finishReason: 'stop',
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      });

      const config = createTestConfig();
      const agent = new Agent(config, mockProvider, memory, tools);
      const result = await agent.run('Say hello');

      expect(result.status).toBe('completed');
      expect(result.output).toBe('Hello, world!');
      expect(result.steps.length).toBeGreaterThan(0);
      expect(result.usage.totalTokens).toBeGreaterThan(0);
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should track execution steps', async () => {
      mockProvider.completeMock.mockResolvedValue({
        content: 'Final answer',
        finishReason: 'stop',
      });

      const agent = new Agent(createTestConfig(), mockProvider, memory, tools);
      const result = await agent.run('Test');

      const types = result.steps.map((s) => s.type);
      expect(types).toContain('thought');
      expect(types).toContain('result');
    });

    it('should emit step events', async () => {
      mockProvider.completeMock.mockResolvedValue({
        content: 'Step output',
        finishReason: 'stop',
      });

      const agent = new Agent(createTestConfig(), mockProvider, memory, tools);
      const stepHandler = vi.fn();
      agent.on('step', stepHandler);

      await agent.run('Test');
      expect(stepHandler).toHaveBeenCalled();
    });

    it('should emit done event on completion', async () => {
      mockProvider.completeMock.mockResolvedValue({
        content: 'Done',
        finishReason: 'stop',
      });

      const agent = new Agent(createTestConfig(), mockProvider, memory, tools);
      const doneHandler = vi.fn();
      agent.on('done', doneHandler);

      await agent.run('Test');
      expect(doneHandler).toHaveBeenCalled();
    });
  });

  describe('tool call execution', () => {
    it('should execute tool calls and continue the loop', async () => {
      const toolResult = { data: 'tool output' };

      mockProvider.completeMock
        .mockResolvedValueOnce({
          content: 'Let me search',
          toolCalls: [{ name: 'web_search', arguments: { query: 'test query' } }],
          finishReason: 'tool_calls',
        })
        .mockResolvedValueOnce({
          content: 'Based on search results, here is the answer.',
          finishReason: 'stop',
        });

      tools.register({
        name: 'web_search',
        description: 'Search the web',
        parameters: {
          type: 'object',
          properties: { query: { type: 'string' } },
          required: ['query'],
        },
        async execute(params: Record<string, unknown>) {
          return toolResult;
        },
      });

      const config = createTestConfig({ tools: ['web_search'] });
      const agent = new Agent(config, mockProvider, memory, tools);
      const result = await agent.run('Search something');

      expect(result.status).toBe('completed');
      expect(result.steps.filter((s) => s.type === 'action').length).toBe(1);
      expect(result.steps.filter((s) => s.type === 'observation').length).toBe(1);
    });

    it('should handle tool execution errors gracefully', async () => {
      mockProvider.completeMock
        .mockResolvedValueOnce({
          content: 'Calling tool',
          toolCalls: [{ name: 'failing_tool', arguments: {} }],
          finishReason: 'tool_calls',
        })
        .mockResolvedValueOnce({
          content: 'Recovered from error',
          finishReason: 'stop',
        });

      tools.register({
        name: 'failing_tool',
        description: 'A tool that fails',
        parameters: {},
        async execute() {
          throw new Error('Tool failure');
        },
      });

      const config = createTestConfig({ tools: ['failing_tool'] });
      const agent = new Agent(config, mockProvider, memory, tools);
      const result = await agent.run('Test tool failure');

      expect(result.status).toBe('completed');
      expect(
        result.steps
          .filter((s) => s.type === 'observation')
          .some((s) => s.content.includes('failed')),
      ).toBe(true);
    });
  });

  describe('memory integration', () => {
    it('should save conversation to memory after completion', async () => {
      mockProvider.completeMock.mockResolvedValue({
        content: 'Saved response',
        finishReason: 'stop',
      });

      const agent = new Agent(createTestConfig(), mockProvider, memory, tools);
      await agent.run('Remember this');

      const history = await memory.getHistory();
      expect(history.length).toBe(2);
      expect(history[0].role).toBe('user');
      expect(history[0].content).toBe('Remember this');
      expect(history[1].role).toBe('assistant');
      expect(history[1].content).toBe('Saved response');
    });
  });

  describe('streaming support', () => {
    it('should handle stream option without errors', async () => {
      mockProvider.completeMock.mockResolvedValue({
        content: 'Streamed output',
        finishReason: 'stop',
      });

      const agent = new Agent(createTestConfig(), mockProvider, memory, tools);
      const result = await agent.run('Stream test', { stream: true });

      expect(result.status).toBe('completed');
      expect(result.output).toBe('Streamed output');
    });
  });

  describe('error handling and retry', () => {
    it('should return failed status on provider error', async () => {
      mockProvider.completeMock.mockRejectedValue(new Error('API error'));

      const agent = new Agent(createTestConfig(), mockProvider, memory, tools);
      const result = await agent.run('Trigger error');

      expect(result.status).toBe('failed');
      expect(result.error).toBeDefined();
    });

    it('should emit error events on failure', async () => {
      mockProvider.completeMock.mockRejectedValue(new Error('API error'));

      const agent = new Agent(createTestConfig(), mockProvider, memory, tools);
      const errorHandler = vi.fn();
      agent.on('error', errorHandler);

      await agent.run('Trigger error');
      expect(errorHandler).toHaveBeenCalled();
    });
  });

  describe('max steps limit', () => {
    it('should stop after max steps even with tool calls', async () => {
      mockProvider.completeMock.mockResolvedValue({
        content: 'Still going',
        toolCalls: [{ name: 'web_search', arguments: { query: 'continue' } }],
        finishReason: 'tool_calls',
      });

      tools.register({
        name: 'web_search',
        description: 'Search',
        parameters: {
          type: 'object',
          properties: { query: { type: 'string' } },
          required: ['query'],
        },
        async execute() {
          return { results: [] };
        },
      });

      const config = createTestConfig({ tools: ['web_search'] });
      const agent = new Agent(config, mockProvider, memory, tools);
      const result = await agent.run('Loop test', { maxSteps: 3 });

      expect(result.status).toBe('completed');
    });
  });
});
