import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../config/database.js';
import { executionService } from '../../services/agent-execution.service.js';
import { executionQueue } from '../../config/queue.js';
import { websocketService } from '../../services/websocket.service.js';
import { llmService } from '../../services/llm.service.js';
import { memoryService } from '../../services/memory.service.js';
import { toolService } from '../../services/tool.service.js';
import { ApiError } from '../../middleware/errorHandler.js';
import { ExecutionStatus, ExecutionType } from '@agentforge/shared';

const mockAgent = {
  id: 'agent-1',
  name: 'Test Agent',
  config: {
    model: 'gpt-4',
    provider: 'openai',
    temperature: 0.7,
    maxTokens: 2048,
    systemPrompt: 'You are helpful',
    memoryEnabled: true,
  },
  tools: [],
  deletedAt: null,
};

const mockExecution = {
  id: 'exec-1',
  type: ExecutionType.AGENT,
  status: ExecutionStatus.PENDING,
  trigger: 'manual',
  input: { prompt: 'Hello' },
  ownerId: 'user-1',
  agentId: 'agent-1',
  metadata: { stream: false },
  output: null,
  error: null,
  duration: null,
  tokenUsage: null,
  cost: null,
  completedAt: null,
  logs: [],
  _count: { logs: 0 },
  createdAt: new Date(),
};

describe('executionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('executeAgent', () => {
    it('should create execution and queue job', async () => {
      vi.mocked(prisma.agent.findFirst).mockResolvedValue(mockAgent as any);
      vi.mocked(prisma.execution.create).mockResolvedValue(mockExecution as any);

      const result = await executionService.executeAgent({
        agentId: 'agent-1',
        userId: 'user-1',
        input: { prompt: 'Hello' },
      });

      expect(prisma.execution.create).toHaveBeenCalledWith({
        data: {
          type: ExecutionType.AGENT,
          status: ExecutionStatus.PENDING,
          trigger: 'manual',
          input: { prompt: 'Hello' },
          ownerId: 'user-1',
          agentId: 'agent-1',
          metadata: { stream: false },
        },
      });
      expect(executionQueue.add).toHaveBeenCalledWith('agent-execution', {
        executionId: 'exec-1',
        agentId: 'agent-1',
        userId: 'user-1',
        input: { prompt: 'Hello' },
      });
      expect(websocketService.sendToUser).toHaveBeenCalledWith('user-1', {
        type: 'execution:started',
        payload: { executionId: 'exec-1', agentId: 'agent-1' },
      });
      expect(result).toEqual(mockExecution);
    });

    it('should return minimal response when streaming', async () => {
      vi.mocked(prisma.agent.findFirst).mockResolvedValue(mockAgent as any);
      vi.mocked(prisma.execution.create).mockResolvedValue(mockExecution as any);

      const result = await executionService.executeAgent({
        agentId: 'agent-1',
        userId: 'user-1',
        input: { prompt: 'Hello' },
        stream: true,
      });

      expect(result).toEqual({ executionId: 'exec-1', status: ExecutionStatus.PENDING });
    });

    it('should throw 404 when agent not found', async () => {
      vi.mocked(prisma.agent.findFirst).mockResolvedValue(null);

      await expect(
        executionService.executeAgent({ agentId: 'bad-id', userId: 'user-1', input: {} }),
      ).rejects.toThrow(ApiError);
    });
  });

  describe('processExecution', () => {
    const jobData = {
      executionId: 'exec-1',
      agentId: 'agent-1',
      userId: 'user-1',
      input: { prompt: 'Hello' },
    };

    const llmResponse = {
      content: 'Hello! How can I help you today?',
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
    };

    it('should process execution successfully', async () => {
      vi.mocked(prisma.execution.update).mockResolvedValue(mockExecution as any);
      vi.mocked(prisma.agent.findUnique).mockResolvedValue(mockAgent as any);
      vi.mocked(memoryService.getRelevantContext).mockResolvedValue(['previous context']);
      vi.mocked(llmService.complete).mockResolvedValue(llmResponse);
      vi.mocked(memoryService.storeMemory).mockResolvedValue({} as any);
      vi.mocked(prisma.executionLog.create).mockResolvedValue({} as any);

      await executionService.processExecution(jobData);

      expect(prisma.execution.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'exec-1' },
          data: { status: ExecutionStatus.RUNNING },
        }),
      );
      expect(websocketService.sendToUser).toHaveBeenCalledWith('user-1', {
        type: 'execution:running',
        payload: { executionId: 'exec-1' },
      });
      expect(llmService.complete).toHaveBeenCalledOnce();
      expect(memoryService.storeMemory).toHaveBeenCalledOnce();
      expect(prisma.execution.update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: ExecutionStatus.COMPLETED,
            output: { content: 'Hello! How can I help you today?', toolResults: [] },
            duration: expect.any(Number),
            tokenUsage: expect.objectContaining({
              totalTokens: 30,
              promptTokens: 10,
              completionTokens: 20,
            }),
            cost: expect.any(Number),
            completedAt: expect.any(Date),
          }),
        }),
      );
      expect(websocketService.sendToUser).toHaveBeenLastCalledWith('user-1', {
        type: 'execution:completed',
        payload: {
          executionId: 'exec-1',
          output: 'Hello! How can I help you today?',
          toolResults: [],
        },
      });
    });

    it('should handle agent not found during execution', async () => {
      vi.mocked(prisma.execution.update).mockResolvedValue(mockExecution as any);
      vi.mocked(prisma.agent.findUnique).mockResolvedValue(null);

      await executionService.processExecution(jobData);

      expect(prisma.execution.update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: ExecutionStatus.FAILED }),
        }),
      );
      expect(websocketService.sendToUser).toHaveBeenLastCalledWith('user-1', {
        type: 'execution:failed',
        payload: { executionId: 'exec-1', error: 'Agent not found during execution' },
      });
    });

    it('should handle LLM errors gracefully', async () => {
      vi.mocked(prisma.execution.update).mockResolvedValue(mockExecution as any);
      vi.mocked(prisma.agent.findUnique).mockResolvedValue(mockAgent as any);
      vi.mocked(memoryService.getRelevantContext).mockResolvedValue([]);
      vi.mocked(llmService.complete).mockRejectedValue(new Error('API rate limit exceeded'));

      await executionService.processExecution(jobData);

      expect(prisma.execution.update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: ExecutionStatus.FAILED,
            error: 'API rate limit exceeded',
          }),
        }),
      );
    });

    it('should extract and execute tool calls from response', async () => {
      vi.mocked(prisma.execution.update).mockResolvedValue(mockExecution as any);
      vi.mocked(prisma.agent.findUnique).mockResolvedValue(mockAgent as any);
      vi.mocked(memoryService.getRelevantContext).mockResolvedValue([]);
      vi.mocked(llmService.complete).mockResolvedValue({
        content:
          'Let me search. <tool_call>{"name":"web_search","parameters":{"query":"weather"}}</tool_call>',
        usage: { promptTokens: 5, completionTokens: 10, totalTokens: 15 },
      });
      vi.mocked(toolService.executeToolByName).mockResolvedValue({ results: ['sunny'] });

      await executionService.processExecution(jobData);

      expect(toolService.executeToolByName).toHaveBeenCalledWith('web_search', 'user-1', {
        query: 'weather',
      });
    });

    it('should not store memory when memoryEnabled is false', async () => {
      const agentNoMemory = { ...mockAgent, config: { ...mockAgent.config, memoryEnabled: false } };
      vi.mocked(prisma.execution.update).mockResolvedValue(mockExecution as any);
      vi.mocked(prisma.agent.findUnique).mockResolvedValue(agentNoMemory as any);
      vi.mocked(memoryService.getRelevantContext).mockResolvedValue([]);
      vi.mocked(llmService.complete).mockResolvedValue(llmResponse);

      await executionService.processExecution(jobData);

      expect(memoryService.storeMemory).not.toHaveBeenCalled();
    });
  });

  describe('buildMessages', () => {
    it('should build message array with system prompt and context', () => {
      const messages = executionService.buildMessages('You are a bot', ['ctx1', 'ctx2'], {
        query: 'hi',
      });

      expect(messages).toHaveLength(4);
      expect(messages[0]).toEqual({ role: 'system', content: 'You are a bot' });
      expect(messages[1]).toEqual({ role: 'system', content: 'Context: ctx1' });
      expect(messages[2]).toEqual({ role: 'system', content: 'Context: ctx2' });
      expect(messages[3]).toEqual({ role: 'user', content: JSON.stringify({ query: 'hi' }) });
    });

    it('should work without system prompt', () => {
      const messages = executionService.buildMessages('', [], { test: true });

      expect(messages).toHaveLength(1);
      expect(messages[0]!.role).toBe('user');
    });
  });

  describe('extractToolCalls', () => {
    it('should extract valid tool calls from content', () => {
      const content = '<tool_call>{"name":"search","parameters":{"q":"test"}}</tool_call>';
      const calls = executionService.extractToolCalls(content);

      expect(calls).toHaveLength(1);
      expect(calls[0]!.name).toBe('search');
    });

    it('should extract multiple tool calls', () => {
      const content = `
        <tool_call>{"name":"a","parameters":{}}</tool_call>
        <tool_call>{"name":"b","parameters":{"x":1}}</tool_call>
      `;
      const calls = executionService.extractToolCalls(content);

      expect(calls).toHaveLength(2);
      expect(calls[0]!.name).toBe('a');
      expect(calls[1]!.name).toBe('b');
    });

    it('should skip invalid JSON tool calls', () => {
      const content =
        '<tool_call>{"name": broken}</tool_call><tool_call>{"name":"valid","parameters":{}}</tool_call>';
      const calls = executionService.extractToolCalls(content);

      expect(calls).toHaveLength(1);
      expect(calls[0]!.name).toBe('valid');
    });

    it('should return empty array when no tool calls', () => {
      expect(executionService.extractToolCalls('Just a normal response')).toEqual([]);
    });
  });

  describe('calculateCost', () => {
    it('should calculate cost based on token usage', () => {
      const cost = executionService.calculateCost({ promptTokens: 1000, completionTokens: 500 });

      expect(cost).toBeCloseTo((1000 * 0.00001 + 500 * 0.00003) / 1000, 10);
    });

    it('should return 0 for zero tokens', () => {
      expect(executionService.calculateCost({ promptTokens: 0, completionTokens: 0 })).toBe(0);
    });
  });

  describe('getExecutionById', () => {
    it('should return execution when owner matches', async () => {
      vi.mocked(prisma.execution.findFirst).mockResolvedValue(mockExecution as any);

      const result = await executionService.getExecutionById('exec-1', 'user-1');

      expect(result).toEqual(mockExecution);
    });

    it('should throw 404 when execution not found', async () => {
      vi.mocked(prisma.execution.findFirst).mockResolvedValue(null);

      await expect(executionService.getExecutionById('bad-id', 'user-1')).rejects.toThrow(ApiError);
    });
  });

  describe('cancelExecution', () => {
    it('should cancel a pending execution', async () => {
      vi.mocked(prisma.execution.findFirst).mockResolvedValue(mockExecution as any);
      const cancelled = { ...mockExecution, status: ExecutionStatus.CANCELLED };
      vi.mocked(prisma.execution.update).mockResolvedValue(cancelled as any);

      const result = await executionService.cancelExecution('exec-1', 'user-1');

      expect(result.status).toBe(ExecutionStatus.CANCELLED);
    });

    it('should throw 400 if execution already completed', async () => {
      vi.mocked(prisma.execution.findFirst).mockResolvedValue({
        ...mockExecution,
        status: ExecutionStatus.COMPLETED,
      } as any);

      await expect(executionService.cancelExecution('exec-1', 'user-1')).rejects.toThrow(ApiError);
    });
  });

  describe('listExecutions', () => {
    it('should return paginated executions', async () => {
      vi.mocked(prisma.execution.findMany).mockResolvedValue([mockExecution] as any);
      vi.mocked(prisma.execution.count).mockResolvedValue(1);

      const result = await executionService.listExecutions({
        userId: 'user-1',
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by status and type', async () => {
      vi.mocked(prisma.execution.findMany).mockResolvedValue([] as any);
      vi.mocked(prisma.execution.count).mockResolvedValue(0);

      await executionService.listExecutions({ userId: 'user-1', status: 'failed', type: 'agent' });

      const findManyCall = vi.mocked(prisma.execution.findMany).mock.calls[0]![0] as any;
      expect(findManyCall.where.status).toBe('failed');
      expect(findManyCall.where.type).toBe('agent');
    });
  });

  describe('getExecutionLogs', () => {
    it('should return logs for execution', async () => {
      vi.mocked(prisma.execution.findFirst).mockResolvedValue(mockExecution as any);
      const logs = [{ id: 'log-1', executionId: 'exec-1', level: 'info', message: 'Started' }];
      vi.mocked(prisma.executionLog.findMany).mockResolvedValue(logs as any);

      const result = await executionService.getExecutionLogs('exec-1', 'user-1');

      expect(result).toEqual(logs);
      expect(prisma.executionLog.findMany).toHaveBeenCalledWith({
        where: { executionId: 'exec-1' },
        orderBy: { timestamp: 'asc' },
      });
    });
  });
});
