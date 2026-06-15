import { prisma } from '../config/database.js';
import { ApiError } from '../middleware/errorHandler.js';
import { AgentStatus } from '@agentforge/shared';

export const agentService = {
  async createAgent(data: {
    name: string;
    description: string;
    capabilities: string[];
    config: Record<string, unknown>;
    ownerId: string;
    teamId?: string;
    avatarUrl?: string;
    isPublic?: boolean;
  }) {
    const agent = await prisma.agent.create({
      data: {
        name: data.name,
        description: data.description,
        capabilities: data.capabilities,
        config: data.config as any,
        ownerId: data.ownerId,
        teamId: data.teamId ?? null,
        avatarUrl: data.avatarUrl ?? null,
        isPublic: data.isPublic ?? false,
        status: AgentStatus.IDLE,
        version: 1,
      },
      include: {
        tools: true,
      },
    });

    await prisma.agentVersion.create({
      data: {
        agentId: agent.id,
        version: 1,
        config: data.config as any,
        snapshot: agent as any,
        createdBy: data.ownerId,
      },
    });

    return agent;
  },

  async getAgentById(id: string, userId: string) {
    const agent = await prisma.agent.findFirst({
      where: {
        id,
        OR: [{ ownerId: userId }, { team: { members: { some: { userId } } } }, { isPublic: true }],
        deletedAt: null,
      },
      include: {
        tools: true,
        team: {
          include: { members: true },
        },
      },
    });

    if (!agent) {
      throw new ApiError(404, 'Agent not found');
    }

    return agent;
  },

  async listAgents(params: {
    ownerId: string;
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      deletedAt: null,
      OR: [
        { ownerId: params.ownerId },
        { team: { members: { some: { userId: params.ownerId } } } },
      ],
    };

    if (params.status) {
      where.status = params.status;
    }

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

    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        where: where as never,
        include: {
          tools: true,
          team: true,
          _count: {
            select: { executions: true },
          },
        },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.agent.count({ where: where as never }),
    ]);

    return {
      data: agents,
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

  async updateAgent(id: string, userId: string, data: Record<string, unknown>) {
    const agent = await this.getAgentById(id, userId);

    if (agent.ownerId !== userId) {
      throw new ApiError(403, 'Not authorized to update this agent');
    }

    const updated = await prisma.agent.update({
      where: { id },
      data: {
        ...data,
        version: agent.version + 1,
      },
      include: { tools: true },
    });

    await prisma.agentVersion.create({
      data: {
        agentId: id,
        version: agent.version + 1,
        config: (data.config ?? {}) as any,
        snapshot: updated,
        createdBy: userId,
      },
    });

    return updated;
  },

  async deleteAgent(id: string, userId: string) {
    const agent = await this.getAgentById(id, userId);

    if (agent.ownerId !== userId) {
      throw new ApiError(403, 'Not authorized to delete this agent');
    }

    await prisma.agent.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },

  async getAgentExecutions(agentId: string, userId: string) {
    await this.getAgentById(agentId, userId);

    return prisma.execution.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  },

  async forkAgent(id: string, userId: string, name?: string) {
    const original = await this.getAgentById(id, userId);

    const forked = await prisma.agent.create({
      data: {
        name: name || `${original.name} (fork)`,
        description: original.description,
        capabilities: original.capabilities,
        config: original.config as any,
        ownerId: userId,
        status: AgentStatus.IDLE,
        avatarUrl: original.avatarUrl,
        isPublic: false,
        version: 1,
        metadata: { forkedFrom: id } as any,
      },
    });

    return forked;
  },
};
