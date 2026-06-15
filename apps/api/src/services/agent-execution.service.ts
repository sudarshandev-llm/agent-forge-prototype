import { prisma } from '../config/database.js';
import { executionQueue } from '../config/queue.js';
import { ApiError } from '../middleware/errorHandler.js';
import { llmService } from './llm.service.js';
import { memoryService } from './memory.service.js';
import { toolService } from './tool.service.js';
import { websocketService } from './websocket.service.js';
import { ExecutionStatus, ExecutionType } from '@agentforge/shared';

export const executionService = {
  async executeAgent(params: {
    agentId: string;
    userId: string;
    input: Record<string, unknown>;
    stream?: boolean;
  }) {
    const agent = await prisma.agent.findFirst({
      where: { id: params.agentId, deletedAt: null },
      include: { tools: true },
    });

    if (!agent) {
      throw new ApiError(404, 'Agent not found');
    }

    const execution = await prisma.execution.create({
      data: {
        type: ExecutionType.AGENT,
        status: ExecutionStatus.PENDING,
        trigger: 'manual',
        input: params.input as any,
        ownerId: params.userId,
        agentId: params.agentId,
        metadata: { stream: params.stream ?? false } as any,
      },
    });

    await executionQueue.add('agent-execution', {
      executionId: execution.id,
      agentId: params.agentId,
      userId: params.userId,
      input: params.input,
    });

    websocketService.sendToUser(params.userId, {
      type: 'execution:started',
      payload: { executionId: execution.id, agentId: params.agentId },
    });

    if (params.stream) {
      return { executionId: execution.id, status: ExecutionStatus.PENDING };
    }

    return execution;
  },

  async processExecution(jobData: {
    executionId: string;
    agentId: string;
    userId: string;
    input: Record<string, unknown>;
  }) {
    const { executionId, agentId, userId, input } = jobData;

    await prisma.execution.update({
      where: { id: executionId },
      data: { status: ExecutionStatus.RUNNING },
    });

    websocketService.sendToUser(userId, {
      type: 'execution:running',
      payload: { executionId },
    });

    try {
      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
        include: { tools: true },
      });

      if (!agent) {
        throw new Error('Agent not found during execution');
      }

      const config = agent.config as {
        model: string;
        provider: string;
        temperature: number;
        maxTokens: number;
        systemPrompt: string;
      };

      const context = await memoryService.getRelevantContext(agentId, JSON.stringify(input));
      const messages = this.buildMessages(config.systemPrompt, context, input);

      const startTime = Date.now();
      const response = await llmService.complete({
        provider: config.provider || 'openai',
        model: config.model || 'gpt-4',
        messages,
        temperature: config.temperature ?? 0.7,
        maxTokens: config.maxTokens ?? 2048,
      });
      const duration = Date.now() - startTime;

      let toolResults: Record<string, unknown>[] = [];
      const toolCalls = this.extractToolCalls(response.content);
      if (toolCalls.length > 0) {
        toolResults = await this.executeToolCalls(toolCalls, userId);
      }

      if (agent.config && (agent.config as Record<string, unknown>).memoryEnabled) {
        await memoryService.storeMemory({
          agentId,
          type: 'conversation' as any,
          key: `execution:${executionId}`,
          content: JSON.stringify({ input, response: response.content }),
          importance: 0.5,
        });
      }

      const tokenUsage = {
        promptTokens: response.usage?.promptTokens || 0,
        completionTokens: response.usage?.completionTokens || 0,
        totalTokens: response.usage?.totalTokens || 0,
        cost: this.calculateCost(response.usage || { promptTokens: 0, completionTokens: 0 }),
      };

      await prisma.execution.update({
        where: { id: executionId },
        data: {
          status: ExecutionStatus.COMPLETED,
          output: { content: response.content, toolResults } as any,
          duration,
          tokenUsage,
          cost: tokenUsage.cost,
          completedAt: new Date(),
        },
      });

      await this.logExecution(executionId, 'info', 'Execution completed', {
        duration,
        tokens: tokenUsage.totalTokens,
      });

      websocketService.sendToUser(userId, {
        type: 'execution:completed',
        payload: { executionId, output: response.content, toolResults },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await prisma.execution.update({
        where: { id: executionId },
        data: {
          status: ExecutionStatus.FAILED,
          error: errorMessage,
          completedAt: new Date(),
        },
      });

      await this.logExecution(executionId, 'error', 'Execution failed', { error: errorMessage });

      websocketService.sendToUser(userId, {
        type: 'execution:failed',
        payload: { executionId, error: errorMessage },
      });
    }
  },

  buildMessages(systemPrompt: string, context: string[], input: Record<string, unknown>) {
    const messages: Array<{ role: string; content: string }> = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    for (const ctx of context) {
      messages.push({ role: 'system', content: `Context: ${ctx}` });
    }

    messages.push({ role: 'user', content: JSON.stringify(input) });

    return messages;
  },

  extractToolCalls(content: string): Array<{ name: string; parameters: Record<string, unknown> }> {
    const toolCalls: Array<{ name: string; parameters: Record<string, unknown> }> = [];
    const regex = /<tool_call>\s*(\{[\s\S]*?\})\s*<\/tool_call>/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      try {
        const parsed = JSON.parse(match[1]!) as {
          name: string;
          parameters: Record<string, unknown>;
        };
        toolCalls.push(parsed);
      } catch {
        // Skip invalid tool calls
      }
    }

    return toolCalls;
  },

  async executeToolCalls(
    toolCalls: Array<{ name: string; parameters: Record<string, unknown> }>,
    userId: string,
  ) {
    const results = [];

    for (const call of toolCalls) {
      try {
        const result = await toolService.executeToolByName(call.name, userId, call.parameters);
        results.push({ name: call.name, success: true, data: result });
      } catch (error) {
        results.push({
          name: call.name,
          success: false,
          error: error instanceof Error ? error.message : 'Tool execution failed',
        });
      }
    }

    return results;
  },

  calculateCost(usage: { promptTokens: number; completionTokens: number }): number {
    const rates = {
      prompt: 0.00001,
      completion: 0.00003,
    };
    return (usage.promptTokens * rates.prompt + usage.completionTokens * rates.completion) / 1000;
  },

  async logExecution(
    executionId: string,
    level: string,
    message: string,
    data?: Record<string, unknown>,
  ) {
    await prisma.executionLog.create({
      data: {
        executionId,
        level,
        message,
        source: 'execution-engine',
        data: (data ?? null) as any,
      },
    });
  },

  async getExecutionById(id: string, userId: string) {
    const execution = await prisma.execution.findFirst({
      where: { id, ownerId: userId },
      include: { logs: true },
    });

    if (!execution) {
      throw new ApiError(404, 'Execution not found');
    }

    return execution;
  },

  async cancelExecution(id: string, userId: string) {
    const execution = await this.getExecutionById(id, userId);

    if (
      execution.status !== ExecutionStatus.PENDING &&
      execution.status !== ExecutionStatus.RUNNING
    ) {
      throw new ApiError(400, 'Execution cannot be cancelled');
    }

    const updated = await prisma.execution.update({
      where: { id },
      data: {
        status: ExecutionStatus.CANCELLED,
        completedAt: new Date(),
      },
    });

    return updated;
  },

  async getExecutionLogs(id: string, userId: string) {
    await this.getExecutionById(id, userId);

    return prisma.executionLog.findMany({
      where: { executionId: id },
      orderBy: { timestamp: 'asc' },
    });
  },

  async listExecutions(params: {
    userId: string;
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { ownerId: params.userId };
    if (params.status) where.status = params.status;
    if (params.type) where.type = params.type;

    const [executions, total] = await Promise.all([
      prisma.execution.findMany({
        where: where as never,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { logs: true } } },
      }),
      prisma.execution.count({ where: where as never }),
    ]);

    return {
      data: executions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  },
};
