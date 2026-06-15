import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../config/database.js';
import { memoryService } from '../../services/memory.service.js';
import { ApiError } from '../../middleware/errorHandler.js';
import { MemoryType } from '@agentforge/shared';

const mockMemory = {
  id: 'mem-1',
  agentId: 'agent-1',
  type: MemoryType.CONVERSATION,
  key: 'session:123',
  content: 'User asked about pricing',
  embedding: null,
  metadata: { source: 'chat' },
  importance: 0.8,
  accessCount: 1,
  expiresAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAgent = { id: 'agent-1', name: 'Test Agent' };

describe('memoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('storeMemory', () => {
    it('should store memory when agent exists', async () => {
      vi.mocked(prisma.agent.findUnique).mockResolvedValue(mockAgent as any);
      vi.mocked(prisma.agentMemory.create).mockResolvedValue(mockMemory);

      const result = await memoryService.storeMemory({
        agentId: 'agent-1',
        type: MemoryType.CONVERSATION,
        key: 'session:123',
        content: 'User asked about pricing',
      });

      expect(prisma.agentMemory.create).toHaveBeenCalledWith({
        data: {
          agentId: 'agent-1',
          type: MemoryType.CONVERSATION,
          key: 'session:123',
          content: 'User asked about pricing',
          metadata: {},
          importance: 0.5,
        },
      });
      expect(result).toEqual(mockMemory);
    });

    it('should use provided metadata and importance', async () => {
      vi.mocked(prisma.agent.findUnique).mockResolvedValue(mockAgent as any);
      vi.mocked(prisma.agentMemory.create).mockResolvedValue(mockMemory);

      await memoryService.storeMemory({
        agentId: 'agent-1',
        type: MemoryType.KNOWLEDGE,
        key: 'doc:1',
        content: 'Important document',
        metadata: { source: 'upload' },
        importance: 0.95,
      });

      expect(prisma.agentMemory.create).toHaveBeenCalledWith({
        data: {
          agentId: 'agent-1',
          type: MemoryType.KNOWLEDGE,
          key: 'doc:1',
          content: 'Important document',
          metadata: { source: 'upload' },
          importance: 0.95,
        },
      });
    });

    it('should throw 404 when agent not found', async () => {
      vi.mocked(prisma.agent.findUnique).mockResolvedValue(null);

      await expect(
        memoryService.storeMemory({
          agentId: 'bad-id',
          type: MemoryType.CONVERSATION,
          key: 'k',
          content: 'test',
        }),
      ).rejects.toThrow(ApiError);
    });
  });

  describe('getMemory', () => {
    it('should return memory and increment access count', async () => {
      vi.mocked(prisma.agentMemory.findUnique).mockResolvedValue(mockMemory);
      vi.mocked(prisma.agentMemory.update).mockResolvedValue({ ...mockMemory, accessCount: 2 });

      const result = await memoryService.getMemory('mem-1');

      expect(prisma.agentMemory.update).toHaveBeenCalledWith({
        where: { id: 'mem-1' },
        data: { accessCount: 2 },
      });
      expect(result).toEqual(mockMemory);
    });

    it('should throw 404 when memory not found', async () => {
      vi.mocked(prisma.agentMemory.findUnique).mockResolvedValue(null);

      await expect(memoryService.getMemory('bad-id')).rejects.toThrow(ApiError);
    });
  });

  describe('updateMemory', () => {
    it('should update existing memory', async () => {
      vi.mocked(prisma.agentMemory.findUnique).mockResolvedValue(mockMemory);
      const updated = { ...mockMemory, content: 'Updated content' };
      vi.mocked(prisma.agentMemory.update).mockResolvedValue(updated);

      const result = await memoryService.updateMemory('mem-1', { content: 'Updated content' });

      expect(prisma.agentMemory.update).toHaveBeenCalledWith({
        where: { id: 'mem-1' },
        data: { content: 'Updated content', metadata: undefined },
      });
      expect(result.content).toBe('Updated content');
    });

    it('should throw 404 when memory not found', async () => {
      vi.mocked(prisma.agentMemory.findUnique).mockResolvedValue(null);

      await expect(memoryService.updateMemory('bad-id', { content: 'x' })).rejects.toThrow(
        ApiError,
      );
    });
  });

  describe('deleteMemory', () => {
    it('should delete existing memory', async () => {
      vi.mocked(prisma.agentMemory.findUnique).mockResolvedValue(mockMemory);

      await memoryService.deleteMemory('mem-1');

      expect(prisma.agentMemory.delete).toHaveBeenCalledWith({ where: { id: 'mem-1' } });
    });

    it('should throw 404 when memory not found', async () => {
      vi.mocked(prisma.agentMemory.findUnique).mockResolvedValue(null);

      await expect(memoryService.deleteMemory('bad-id')).rejects.toThrow(ApiError);
    });
  });

  describe('listMemories', () => {
    it('should list memories for an agent ordered by importance', async () => {
      vi.mocked(prisma.agentMemory.findMany).mockResolvedValue([
        mockMemory,
        { ...mockMemory, id: 'mem-2' },
      ]);

      const result = await memoryService.listMemories('agent-1');

      expect(prisma.agentMemory.findMany).toHaveBeenCalledWith({
        where: { agentId: 'agent-1' },
        orderBy: { importance: 'desc' },
      });
      expect(result).toHaveLength(2);
    });

    it('should filter by type when provided', async () => {
      vi.mocked(prisma.agentMemory.findMany).mockResolvedValue([]);

      await memoryService.listMemories('agent-1', 'knowledge');

      const findManyCall = vi.mocked(prisma.agentMemory.findMany).mock.calls[0]![0] as any;
      expect(findManyCall.where.type).toBe('knowledge');
    });
  });

  describe('getRelevantContext', () => {
    it('should return top 10 memory contents ordered by importance', async () => {
      const memories = Array.from({ length: 12 }, (_, i) => ({
        ...mockMemory,
        id: `mem-${i}`,
        content: `Context ${i}`,
        importance: 1 - i * 0.05,
      }));
      vi.mocked(prisma.agentMemory.findMany).mockResolvedValue(memories);

      const result = await memoryService.getRelevantContext('agent-1', 'test query');

      expect(result).toHaveLength(12);
      expect(prisma.agentMemory.findMany).toHaveBeenCalledWith({
        where: {
          agentId: 'agent-1',
          OR: [{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }],
        },
        orderBy: { importance: 'desc' },
        take: 10,
      });
    });
  });

  describe('searchMemories', () => {
    it('should search with filters', async () => {
      vi.mocked(prisma.agentMemory.findMany).mockResolvedValue([mockMemory]);

      const result = await memoryService.searchMemories({
        agentId: 'agent-1',
        query: 'test',
        types: ['conversation', 'knowledge'],
        limit: 5,
        minImportance: 0.3,
      });

      const findManyCall = vi.mocked(prisma.agentMemory.findMany).mock.calls[0]![0] as any;
      expect(findManyCall.where.agentId).toBe('agent-1');
      expect(findManyCall.where.importance).toEqual({ gte: 0.3 });
      expect(findManyCall.where.type).toEqual({ in: ['conversation', 'knowledge'] });
      expect(findManyCall.take).toBe(5);
      expect(result).toHaveLength(1);
    });

    it('should use defaults when optional params omitted', async () => {
      vi.mocked(prisma.agentMemory.findMany).mockResolvedValue([]);

      await memoryService.searchMemories({ agentId: 'agent-1', query: 'test' });

      const findManyCall = vi.mocked(prisma.agentMemory.findMany).mock.calls[0]![0] as any;
      expect(findManyCall.where.importance).toEqual({ gte: 0 });
      expect(findManyCall.take).toBe(20);
    });
  });

  describe('pruneMemories', () => {
    it('should not prune if count within limit', async () => {
      vi.mocked(prisma.agentMemory.count).mockResolvedValue(500);

      const result = await memoryService.pruneMemories('agent-1', 1000);

      expect(result).toBe(500);
      expect(prisma.agentMemory.findMany).not.toHaveBeenCalled();
    });

    it('should delete lowest importance memories when over limit', async () => {
      vi.mocked(prisma.agentMemory.count).mockResolvedValue(100);
      const toDelete = Array.from({ length: 50 }, (_, i) => ({ id: `low-mem-${i}` }));
      vi.mocked(prisma.agentMemory.findMany).mockResolvedValue(toDelete as any);

      const result = await memoryService.pruneMemories('agent-1', 50);

      expect(prisma.agentMemory.findMany).toHaveBeenCalledWith({
        where: { agentId: 'agent-1' },
        orderBy: [{ importance: 'asc' }, { accessCount: 'asc' }],
        take: 50,
        select: { id: true },
      });
      expect(prisma.agentMemory.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: toDelete.map((m) => m.id) } },
      });
      expect(result).toBe(50);
    });
  });
});
