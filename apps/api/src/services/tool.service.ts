import { prisma } from '../config/database.js';
import { ApiError } from '../middleware/errorHandler.js';
import { ToolType, IToolExecutionResult } from '@agentforge/shared';

export const toolService = {
  async createTool(data: {
    name: string;
    description: string;
    type: ToolType;
    config: Record<string, unknown>;
    category?: string;
    ownerId: string;
    isPublic?: boolean;
  }) {
    const tool = await prisma.tool.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        config: data.config as any,
        category: data.category || 'general',
        ownerId: data.ownerId,
        isPublic: data.isPublic ?? false,
        isBuiltin: false,
        version: 1,
      },
    });

    return tool;
  },

  async getToolById(id: string, userId: string) {
    const tool = await prisma.tool.findFirst({
      where: {
        id,
        OR: [
          { ownerId: userId },
          { isPublic: true },
        ],
        deletedAt: null,
      },
    });

    if (!tool) {
      throw new ApiError(404, 'Tool not found');
    }

    return tool;
  },

  async listTools(params: {
    ownerId: string;
    page?: number;
    limit?: number;
    type?: string;
    search?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      deletedAt: null,
      OR: [
        { ownerId: params.ownerId },
        { isPublic: true },
      ],
    };

    if (params.type) where.type = params.type;
    if (params.search) {
      where.AND = [
        {
          OR: [
            { name: { contains: params.search, mode: 'insensitive' } },
            { description: { contains: params.search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const [tools, total] = await Promise.all([
      prisma.tool.findMany({
        where: where as never,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.tool.count({ where: where as never }),
    ]);

    return {
      data: tools,
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

  async updateTool(id: string, userId: string, data: Record<string, unknown>) {
    const tool = await this.getToolById(id, userId);

    if (tool.ownerId !== userId && !tool.isBuiltin) {
      throw new ApiError(403, 'Not authorized to update this tool');
    }

    return prisma.tool.update({
      where: { id },
      data: { ...data, version: tool.version + 1 },
    });
  },

  async deleteTool(id: string, userId: string) {
    const tool = await this.getToolById(id, userId);

    if (tool.ownerId !== userId) {
      throw new ApiError(403, 'Not authorized to delete this tool');
    }

    await prisma.tool.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },

  async executeTool(params: {
    toolId: string;
    userId: string;
    parameters: Record<string, unknown>;
  }): Promise<IToolExecutionResult> {
    const tool = await this.getToolById(params.toolId, params.userId);
    return this.runToolExecution(tool, params.parameters, params.userId);
  },

  async executeToolByName(
    name: string,
    userId: string,
    parameters: Record<string, unknown>,
  ): Promise<unknown> {
    const tool = await prisma.tool.findFirst({
      where: { name, deletedAt: null },
    });

    if (!tool) {
      throw new ApiError(404, `Tool "${name}" not found`);
    }

    const result = await this.runToolExecution(tool, parameters, userId);
    return result.data;
  },

  async runToolExecution(
    tool: Record<string, unknown>,
    parameters: Record<string, unknown>,
    userId: string,
  ): Promise<IToolExecutionResult> {
    const startTime = Date.now();
    const config = tool.config as { type: string; endpoint?: string; method?: string };

    try {
      const execution = await prisma.execution.create({
        data: {
          type: 'tool' as never,
          status: 'running' as never,
          trigger: 'manual',
          input: parameters as any,
          ownerId: userId,
          metadata: { toolId: tool.id, toolName: tool.name } as any,
        },
      });

      let result: unknown;

      switch (config.type) {
        case 'api_call':
          result = await this.executeApiCall(config, parameters);
          break;
        case 'code_execution':
          result = await this.executeCode(config, parameters);
          break;
        case 'web_search':
          result = await this.executeWebSearch(parameters);
          break;
        default:
          result = { message: `Tool type ${config.type} execution not implemented` };
      }

      const duration = Date.now() - startTime;

      await prisma.execution.update({
        where: { id: execution.id },
        data: {
          status: 'completed' as never,
          output: result as any,
          duration,
          completedAt: new Date(),
        },
      });

      return {
        success: true,
        data: result,
        duration,
        output: result as Record<string, unknown>,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Tool execution failed',
        duration,
        output: {},
      };
    }
  },

  async executeApiCall(config: Record<string, unknown>, parameters: Record<string, unknown>) {
    const { endpoint, method = 'GET', headers = {} } = config;

    if (!endpoint) throw new ApiError(400, 'API endpoint not configured');

    const response = await fetch(endpoint as string, {
      method: method as string,
      headers: {
        'Content-Type': 'application/json',
        ...(headers as Record<string, string>),
      },
      body: method !== 'GET' ? JSON.stringify(parameters) : undefined,
    });

    return response.json();
  },

  async executeCode(config: Record<string, unknown>, parameters: Record<string, unknown>) {
    return { message: 'Code execution sandbox', parameters };
  },

  async executeWebSearch(parameters: Record<string, unknown>) {
    const query = parameters.query as string;
    if (!query) throw new ApiError(400, 'Search query required');

    return { query, results: [] };
  },
};
