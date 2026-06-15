import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../config/database.js';
import { agentService } from '../../services/agent.service.js';
import { ApiError } from '../../middleware/errorHandler.js';
import { AgentStatus } from '@agentforge/shared';

const mockAgent = {
  id: 'agent-1',
  name: 'Test Agent',
  description: 'A test agent',
  capabilities: ['code_generation'],
  config: {
    model: 'gpt-4',
    provider: 'openai',
    temperature: 0.7,
    maxTokens: 2048,
    systemPrompt: 'You are helpful',
  },
  ownerId: 'user-1',
  teamId: null,
  avatarUrl: null,
  isPublic: false,
  status: AgentStatus.IDLE,
  version: 1,
  metadata: null,
  tools: [],
  _count: { executions: 0 },
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const mockAgentWithTeam = {
  ...mockAgent,
  team: {
    id: 'team-1',
    members: [{ userId: 'user-2', role: 'member' }],
  },
};

describe('agentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createAgent', () => {
    it('should create an agent with version snapshot', async () => {
      const createData = {
        name: 'Test Agent',
        description: 'A test agent',
        capabilities: ['code_generation'],
        config: { model: 'gpt-4' },
        ownerId: 'user-1',
      };

      vi.mocked(prisma.agent.create).mockResolvedValue(mockAgent);

      const result = await agentService.createAgent(createData);

      expect(prisma.agent.create).toHaveBeenCalledWith({
        data: {
          name: createData.name,
          description: createData.description,
          capabilities: createData.capabilities,
          config: createData.config,
          ownerId: createData.ownerId,
          teamId: null,
          avatarUrl: null,
          isPublic: false,
          status: AgentStatus.IDLE,
          version: 1,
        },
        include: { tools: true },
      });

      expect(prisma.agentVersion.create).toHaveBeenCalledWith({
        data: {
          agentId: mockAgent.id,
          version: 1,
          config: createData.config,
          snapshot: mockAgent,
          createdBy: createData.ownerId,
        },
      });

      expect(result).toEqual(mockAgent);
    });

    it('should create agent with optional team and public flag', async () => {
      const createData = {
        name: 'Team Agent',
        description: 'Team owned agent',
        capabilities: [],
        config: {},
        ownerId: 'user-1',
        teamId: 'team-1',
        isPublic: true,
        avatarUrl: 'https://example.com/avatar.png',
      };

      const expected = {
        ...mockAgent,
        ...createData,
        teamId: 'team-1',
        isPublic: true,
        avatarUrl: createData.avatarUrl,
      };
      vi.mocked(prisma.agent.create).mockResolvedValue(expected);

      const result = await agentService.createAgent(createData);

      expect(prisma.agent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            teamId: 'team-1',
            isPublic: true,
            avatarUrl: 'https://example.com/avatar.png',
          }),
        }),
      );
      expect(result.isPublic).toBe(true);
    });
  });

  describe('getAgentById', () => {
    it('should return agent when user is owner', async () => {
      vi.mocked(prisma.agent.findFirst).mockResolvedValue(mockAgent);

      const result = await agentService.getAgentById('agent-1', 'user-1');

      expect(prisma.agent.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'agent-1',
          OR: [
            { ownerId: 'user-1' },
            { team: { members: { some: { userId: 'user-1' } } } },
            { isPublic: true },
          ],
          deletedAt: null,
        },
        include: { tools: true, team: { include: { members: true } } },
      });
      expect(result).toEqual(mockAgent);
    });

    it('should throw 404 when agent not found', async () => {
      vi.mocked(prisma.agent.findFirst).mockResolvedValue(null);

      await expect(agentService.getAgentById('bad-id', 'user-1')).rejects.toThrow(ApiError);
      await expect(agentService.getAgentById('bad-id', 'user-1')).rejects.toThrow(
        'Agent not found',
      );
    });
  });

  describe('listAgents', () => {
    it('should return paginated agents', async () => {
      vi.mocked(prisma.agent.findMany).mockResolvedValue([mockAgent]);
      vi.mocked(prisma.agent.count).mockResolvedValue(1);

      const result = await agentService.listAgents({ ownerId: 'user-1', page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should filter by status', async () => {
      vi.mocked(prisma.agent.findMany).mockResolvedValue([]);
      vi.mocked(prisma.agent.count).mockResolvedValue(0);

      await agentService.listAgents({ ownerId: 'user-1', status: 'idle' });

      const findManyCall = vi.mocked(prisma.agent.findMany).mock.calls[0]![0] as any;
      expect(findManyCall.where.status).toBe('idle');
    });

    it('should search by name and description', async () => {
      vi.mocked(prisma.agent.findMany).mockResolvedValue([]);
      vi.mocked(prisma.agent.count).mockResolvedValue(0);

      await agentService.listAgents({ ownerId: 'user-1', search: 'test' });

      const findManyCall = vi.mocked(prisma.agent.findMany).mock.calls[0]![0] as any;
      expect(findManyCall.where.AND[0].OR).toContainEqual(
        expect.objectContaining({ name: expect.objectContaining({ contains: 'test' }) }),
      );
    });

    it('should use default pagination values', async () => {
      vi.mocked(prisma.agent.findMany).mockResolvedValue([]);
      vi.mocked(prisma.agent.count).mockResolvedValue(0);

      await agentService.listAgents({ ownerId: 'user-1' });

      const findManyCall = vi.mocked(prisma.agent.findMany).mock.calls[0]![0] as any;
      expect(findManyCall.skip).toBe(0);
      expect(findManyCall.take).toBe(20);
    });
  });

  describe('updateAgent', () => {
    it('should update agent when user is owner', async () => {
      vi.mocked(prisma.agent.findFirst).mockResolvedValue(mockAgent);
      const updatedAgent = { ...mockAgent, name: 'Updated', version: 2 };
      vi.mocked(prisma.agent.update).mockResolvedValue(updatedAgent);

      const result = await agentService.updateAgent('agent-1', 'user-1', { name: 'Updated' });

      expect(prisma.agent.update).toHaveBeenCalledWith({
        where: { id: 'agent-1' },
        data: { name: 'Updated', version: 2 },
        include: { tools: true },
      });
      expect(result.name).toBe('Updated');
    });

    it('should throw 403 when user is not owner', async () => {
      vi.mocked(prisma.agent.findFirst).mockResolvedValue(mockAgent);

      await expect(agentService.updateAgent('agent-1', 'user-2', { name: 'Hack' })).rejects.toThrow(
        ApiError,
      );
      await expect(agentService.updateAgent('agent-1', 'user-2', { name: 'Hack' })).rejects.toThrow(
        'Not authorized',
      );
    });

    it('should create a new version snapshot on update', async () => {
      vi.mocked(prisma.agent.findFirst).mockResolvedValue(mockAgent);
      vi.mocked(prisma.agent.update).mockResolvedValue({ ...mockAgent, version: 2 });

      await agentService.updateAgent('agent-1', 'user-1', { config: { model: 'gpt-4-turbo' } });

      expect(prisma.agentVersion.create).toHaveBeenCalledWith({
        data: {
          agentId: 'agent-1',
          version: 2,
          config: { model: 'gpt-4-turbo' },
          snapshot: expect.any(Object),
          createdBy: 'user-1',
        },
      });
    });
  });

  describe('deleteAgent', () => {
    it('should soft-delete agent when authorized', async () => {
      vi.mocked(prisma.agent.findFirst).mockResolvedValue(mockAgent);

      await agentService.deleteAgent('agent-1', 'user-1');

      expect(prisma.agent.update).toHaveBeenCalledWith({
        where: { id: 'agent-1' },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should throw 403 when non-owner tries to delete', async () => {
      vi.mocked(prisma.agent.findFirst).mockResolvedValue(mockAgent);

      await expect(agentService.deleteAgent('agent-1', 'user-2')).rejects.toThrow(ApiError);
    });
  });

  describe('forkAgent', () => {
    it('should create a forked copy of the agent', async () => {
      vi.mocked(prisma.agent.findFirst).mockResolvedValue(mockAgent);
      const forked = {
        ...mockAgent,
        id: 'agent-2',
        name: 'Test Agent (fork)',
        ownerId: 'user-2',
        version: 1,
      };
      vi.mocked(prisma.agent.create).mockResolvedValue(forked);

      const result = await agentService.forkAgent('agent-1', 'user-2');

      expect(prisma.agent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: { forkedFrom: 'agent-1' },
            ownerId: 'user-2',
            isPublic: false,
          }),
        }),
      );
      expect(result.id).toBe('agent-2');
      expect(result.ownerId).toBe('user-2');
    });

    it('should use custom fork name when provided', async () => {
      vi.mocked(prisma.agent.findFirst).mockResolvedValue(mockAgent);
      vi.mocked(prisma.agent.create).mockResolvedValue({
        ...mockAgent,
        id: 'agent-3',
        name: 'My Custom Fork',
      });

      const result = await agentService.forkAgent('agent-1', 'user-1', 'My Custom Fork');

      expect(prisma.agent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'My Custom Fork' }),
        }),
      );
      expect(result.name).toBe('My Custom Fork');
    });
  });

  describe('getAgentExecutions', () => {
    it('should return executions for accessible agent', async () => {
      vi.mocked(prisma.agent.findFirst).mockResolvedValue(mockAgent);
      const executions = [{ id: 'exec-1', agentId: 'agent-1' }];
      vi.mocked(prisma.execution.findMany).mockResolvedValue(executions as any);

      const result = await agentService.getAgentExecutions('agent-1', 'user-1');

      expect(prisma.execution.findMany).toHaveBeenCalledWith({
        where: { agentId: 'agent-1' },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      expect(result).toEqual(executions);
    });

    it('should throw when agent not found', async () => {
      vi.mocked(prisma.agent.findFirst).mockResolvedValue(null);

      await expect(agentService.getAgentExecutions('bad-id', 'user-1')).rejects.toThrow(ApiError);
    });
  });
});
