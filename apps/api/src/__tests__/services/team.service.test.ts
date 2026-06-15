import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../config/database.js';
import { teamService } from '../../services/team.service.js';
import { ApiError } from '../../middleware/errorHandler.js';
import { TeamRole } from '@agentforge/shared';

const mockTeam = {
  id: 'team-1',
  name: 'My Team',
  description: 'A test team',
  avatarUrl: null,
  ownerId: 'user-1',
  isPersonal: false,
  maxMembers: 10,
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  members: [
    {
      id: 'tm-1',
      teamId: 'team-1',
      userId: 'user-1',
      role: TeamRole.OWNER,
      joinedAt: new Date(),
      lastActiveAt: null,
    },
  ],
  agents: [],
  _count: { agents: 0 },
};

const mockTeamWithMembers = {
  ...mockTeam,
  members: [
    ...mockTeam.members,
    {
      id: 'tm-2',
      teamId: 'team-1',
      userId: 'user-2',
      role: TeamRole.ADMIN,
      joinedAt: new Date(),
      lastActiveAt: null,
    },
    {
      id: 'tm-3',
      teamId: 'team-1',
      userId: 'user-3',
      role: TeamRole.MEMBER,
      joinedAt: new Date(),
      lastActiveAt: null,
    },
  ],
};

describe('teamService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTeam', () => {
    it('should create a team with owner as member', async () => {
      vi.mocked(prisma.team.create).mockResolvedValue(mockTeam as any);

      const result = await teamService.createTeam({
        name: 'My Team',
        description: 'A test team',
        ownerId: 'user-1',
      });

      expect(prisma.team.create).toHaveBeenCalledWith({
        data: {
          name: 'My Team',
          description: 'A test team',
          avatarUrl: null,
          ownerId: 'user-1',
          members: { create: { userId: 'user-1', role: TeamRole.OWNER } },
        },
        include: { members: true },
      });
      expect(result.id).toBe('team-1');
      expect(result.members).toHaveLength(1);
    });

    it('should default description to empty string', async () => {
      vi.mocked(prisma.team.create).mockResolvedValue({ ...mockTeam, description: '' } as any);

      await teamService.createTeam({ name: 'Minimal Team', ownerId: 'user-1' });

      expect(prisma.team.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ description: '' }),
        }),
      );
    });
  });

  describe('getTeamById', () => {
    it('should return team when user is a member', async () => {
      vi.mocked(prisma.team.findFirst).mockResolvedValue(mockTeamWithMembers as any);

      const result = await teamService.getTeamById('team-1', 'user-1');

      expect(prisma.team.findFirst).toHaveBeenCalledWith({
        where: { id: 'team-1', members: { some: { userId: 'user-1' } }, deletedAt: null },
        include: {
          members: {
            include: { user: { select: { id: true, email: true, name: true, avatarUrl: true } } },
          },
          _count: { select: { agents: true } },
        },
      });
      expect(result.members).toHaveLength(3);
    });

    it('should throw 404 when not a member', async () => {
      vi.mocked(prisma.team.findFirst).mockResolvedValue(null);

      await expect(teamService.getTeamById('team-1', 'non-member')).rejects.toThrow(ApiError);
    });
  });

  describe('listTeams', () => {
    it('should list teams user belongs to', async () => {
      vi.mocked(prisma.team.findMany).mockResolvedValue([
        mockTeam,
        { ...mockTeam, id: 'team-2' },
      ] as any);

      const result = await teamService.listTeams('user-1');

      expect(result).toHaveLength(2);
      expect(prisma.team.findMany).toHaveBeenCalledWith({
        where: { members: { some: { userId: 'user-1' } }, deletedAt: null },
        include: { members: true, _count: { select: { agents: true } } },
      });
    });
  });

  describe('updateTeam', () => {
    it('should update when user is admin or owner', async () => {
      vi.mocked(prisma.team.findFirst).mockResolvedValue(mockTeamWithMembers as any);
      vi.mocked(prisma.team.update).mockResolvedValue({ ...mockTeam, name: 'Updated Team' } as any);

      const result = await teamService.updateTeam('team-1', 'user-1', { name: 'Updated Team' });

      expect(prisma.team.update).toHaveBeenCalledWith({
        where: { id: 'team-1' },
        data: { name: 'Updated Team' },
        include: { members: true },
      });
      expect(result.name).toBe('Updated Team');
    });

    it('should throw 403 when user has no permission', async () => {
      vi.mocked(prisma.team.findFirst).mockResolvedValue(mockTeamWithMembers as any);

      await expect(teamService.updateTeam('team-1', 'user-3', { name: 'Hack' })).rejects.toThrow(
        ApiError,
      );
    });
  });

  describe('deleteTeam', () => {
    it('should soft-delete when user is owner', async () => {
      vi.mocked(prisma.team.findFirst).mockResolvedValue(mockTeam as any);

      await teamService.deleteTeam('team-1', 'user-1');

      expect(prisma.team.update).toHaveBeenCalledWith({
        where: { id: 'team-1' },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should throw 403 when non-owner tries to delete', async () => {
      vi.mocked(prisma.team.findFirst).mockResolvedValue(mockTeam as any);

      await expect(teamService.deleteTeam('team-1', 'user-2')).rejects.toThrow(ApiError);
    });
  });

  describe('addMember', () => {
    it('should add member when user has permission', async () => {
      vi.mocked(prisma.team.findFirst).mockResolvedValue(mockTeamWithMembers as any);
      vi.mocked(prisma.teamMember.findUnique).mockResolvedValue(null);
      const newMember = {
        id: 'tm-4',
        teamId: 'team-1',
        userId: 'user-4',
        role: TeamRole.MEMBER,
        user: { id: 'user-4', email: 'new@test.com', name: 'New User', avatarUrl: null },
      };
      vi.mocked(prisma.teamMember.create).mockResolvedValue(newMember as any);

      const result = await teamService.addMember('team-1', 'user-1', {
        userId: 'user-4',
        role: TeamRole.MEMBER,
      });

      expect(prisma.teamMember.create).toHaveBeenCalledWith({
        data: { teamId: 'team-1', userId: 'user-4', role: TeamRole.MEMBER },
        include: { user: { select: { id: true, email: true, name: true, avatarUrl: true } } },
      });
      expect(result.userId).toBe('user-4');
    });

    it('should throw 409 when user is already a member', async () => {
      vi.mocked(prisma.team.findFirst).mockResolvedValue(mockTeam as any);
      vi.mocked(prisma.teamMember.findUnique).mockResolvedValue({} as any);

      await expect(
        teamService.addMember('team-1', 'user-1', { userId: 'user-2', role: TeamRole.MEMBER }),
      ).rejects.toThrow(ApiError);
    });

    it('should throw 400 when team is full', async () => {
      const fullTeam = {
        ...mockTeam,
        members: Array.from({ length: mockTeam.maxMembers }, (_, i) => ({
          userId: `user-${i}`,
          role: TeamRole.MEMBER,
        })),
      };
      vi.mocked(prisma.team.findFirst).mockResolvedValue(fullTeam as any);

      await expect(
        teamService.addMember('team-1', 'user-1', { userId: 'new-user', role: TeamRole.MEMBER }),
      ).rejects.toThrow(ApiError);
    });
  });

  describe('removeMember', () => {
    it('should remove member when authorized', async () => {
      vi.mocked(prisma.team.findFirst).mockResolvedValue(mockTeamWithMembers as any);

      await teamService.removeMember('team-1', 'user-1', 'user-3');

      expect(prisma.teamMember.delete).toHaveBeenCalledWith({
        where: { teamId_userId: { teamId: 'team-1', userId: 'user-3' } },
      });
    });

    it('should throw 400 when trying to remove owner', async () => {
      vi.mocked(prisma.team.findFirst).mockResolvedValue(mockTeamWithMembers as any);

      await expect(teamService.removeMember('team-1', 'user-1', 'user-1')).rejects.toThrow(
        ApiError,
      );
    });
  });

  describe('updateMemberRole', () => {
    it('should update role when user is owner', async () => {
      vi.mocked(prisma.team.findFirst).mockResolvedValue(mockTeamWithMembers as any);
      const updated = { ...mockTeamWithMembers.members[2]!, role: TeamRole.ADMIN };
      vi.mocked(prisma.teamMember.update).mockResolvedValue(updated as any);

      const result = await teamService.updateMemberRole(
        'team-1',
        'user-1',
        'user-3',
        TeamRole.ADMIN,
      );

      expect(prisma.teamMember.update).toHaveBeenCalledWith({
        where: { teamId_userId: { teamId: 'team-1', userId: 'user-3' } },
        data: { role: TeamRole.ADMIN },
      });
      expect(result.role).toBe(TeamRole.ADMIN);
    });

    it('should throw 400 when trying to change owner role', async () => {
      vi.mocked(prisma.team.findFirst).mockResolvedValue(mockTeamWithMembers as any);

      await expect(
        teamService.updateMemberRole('team-1', 'user-1', 'user-1', TeamRole.MEMBER),
      ).rejects.toThrow(ApiError);
    });
  });

  describe('getTeamAgents', () => {
    it('should return agents for the team', async () => {
      vi.mocked(prisma.team.findFirst).mockResolvedValue(mockTeam as any);
      const agents = [{ id: 'agent-1', name: 'Agent 1', tools: [] }];
      vi.mocked(prisma.agent.findMany).mockResolvedValue(agents as any);

      const result = await teamService.getTeamAgents('team-1', 'user-1');

      expect(prisma.agent.findMany).toHaveBeenCalledWith({
        where: { teamId: 'team-1', deletedAt: null },
        include: { tools: true },
      });
      expect(result).toEqual(agents);
    });
  });
});
