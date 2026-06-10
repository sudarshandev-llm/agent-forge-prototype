import { prisma } from '../config/database.js';
import { ApiError } from '../middleware/errorHandler.js';
import { MemoryType, ICreateMemoryDTO, IUpdateMemoryDTO } from '@agentforge/shared';

export const memoryService = {
  async storeMemory(data: ICreateMemoryDTO) {
    const agent = await prisma.agent.findUnique({
      where: { id: data.agentId },
    });

    if (!agent) {
      throw new ApiError(404, 'Agent not found');
    }

    return prisma.agentMemory.create({
      data: {
        agentId: data.agentId,
        type: data.type || MemoryType.CONVERSATION,
        key: data.key,
        content: data.content,
        metadata: data.metadata ?? {},
        importance: data.importance ?? 0.5,
      },
    });
  },

  async getMemory(id: string) {
    const memory = await prisma.agentMemory.findUnique({ where: { id } });
    if (!memory) {
      throw new ApiError(404, 'Memory not found');
    }

    await prisma.agentMemory.update({
      where: { id },
      data: { accessCount: memory.accessCount + 1 },
    });

    return memory;
  },

  async updateMemory(id: string, data: IUpdateMemoryDTO) {
    const memory = await prisma.agentMemory.findUnique({ where: { id } });
    if (!memory) {
      throw new ApiError(404, 'Memory not found');
    }

    return prisma.agentMemory.update({
      where: { id },
      data: {
        ...data,
        metadata: data.metadata ?? undefined,
      },
    });
  },

  async deleteMemory(id: string) {
    const memory = await prisma.agentMemory.findUnique({ where: { id } });
    if (!memory) {
      throw new ApiError(404, 'Memory not found');
    }

    await prisma.agentMemory.delete({ where: { id } });
  },

  async listMemories(agentId: string, type?: string) {
    const where: Record<string, unknown> = { agentId };
    if (type) where.type = type;

    return prisma.agentMemory.findMany({
      where: where as never,
      orderBy: { importance: 'desc' },
    });
  },

  async getRelevantContext(agentId: string, query: string): Promise<string[]> {
    const memories = await prisma.agentMemory.findMany({
      where: {
        agentId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: { importance: 'desc' },
      take: 10,
    });

    return memories.map((m) => m.content);
  },

  async searchMemories(params: {
    agentId: string;
    query: string;
    types?: string[];
    limit?: number;
    minImportance?: number;
  }) {
    const where: Record<string, unknown> = {
      agentId: params.agentId,
      importance: { gte: params.minImportance ?? 0 },
    };

    if (params.types && params.types.length > 0) {
      where.type = { in: params.types };
    }

    return prisma.agentMemory.findMany({
      where: where as never,
      orderBy: { importance: 'desc' },
      take: params.limit ?? 20,
    });
  },

  async pruneMemories(agentId: string, maxCount: number = 1000) {
    const count = await prisma.agentMemory.count({ where: { agentId } });

    if (count <= maxCount) return count;

    const toDelete = await prisma.agentMemory.findMany({
      where: { agentId },
      orderBy: [{ importance: 'asc' }, { accessCount: 'asc' }],
      take: count - maxCount,
      select: { id: true },
    });

    await prisma.agentMemory.deleteMany({
      where: { id: { in: toDelete.map((m) => m.id) } },
    });

    return count - toDelete.length;
  },
};
