import { prisma } from '../config/database.js';
import { ApiError } from '../middleware/errorHandler.js';
import { TeamRole } from '@agentforge/shared';

export const teamService = {
  async createTeam(data: {
    name: string;
    description?: string;
    avatarUrl?: string;
    ownerId: string;
  }) {
    const team = await prisma.team.create({
      data: {
        name: data.name,
        description: data.description || '',
        avatarUrl: data.avatarUrl ?? null,
        ownerId: data.ownerId,
        members: {
          create: {
            userId: data.ownerId,
            role: TeamRole.OWNER,
          },
        },
      },
      include: {
        members: true,
      },
    });

    return team;
  },

  async getTeamById(id: string, userId: string) {
    const team = await prisma.team.findFirst({
      where: {
        id,
        members: { some: { userId } },
        deletedAt: null,
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, name: true, avatarUrl: true },
            },
          },
        },
        _count: {
          select: { agents: true },
        },
      },
    });

    if (!team) {
      throw new ApiError(404, 'Team not found');
    }

    return team;
  },

  async listTeams(userId: string) {
    return prisma.team.findMany({
      where: {
        members: { some: { userId } },
        deletedAt: null,
      },
      include: {
        members: true,
        _count: { select: { agents: true } },
      },
    });
  },

  async updateTeam(
    id: string,
    userId: string,
    data: { name?: string; description?: string; avatarUrl?: string },
  ) {
    const team = await this.getTeamById(id, userId);
    const member = team.members.find((m) => m.userId === userId);

    if (!member || (member.role !== TeamRole.OWNER && member.role !== TeamRole.ADMIN)) {
      throw new ApiError(403, 'Not authorized to update this team');
    }

    return prisma.team.update({
      where: { id },
      data,
      include: { members: true },
    });
  },

  async deleteTeam(id: string, userId: string) {
    const team = await this.getTeamById(id, userId);

    if (team.ownerId !== userId) {
      throw new ApiError(403, 'Only the owner can delete the team');
    }

    await prisma.team.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },

  async addMember(teamId: string, userId: string, data: { userId: string; role: TeamRole }) {
    const team = await this.getTeamById(teamId, userId);
    const member = team.members.find((m) => m.userId === userId);

    if (!member || (member.role !== TeamRole.OWNER && member.role !== TeamRole.ADMIN)) {
      throw new ApiError(403, 'Not authorized to add members');
    }

    if (team.members.length >= team.maxMembers) {
      throw new ApiError(400, 'Team member limit reached');
    }

    const existingMember = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: data.userId } },
    });

    if (existingMember) {
      throw new ApiError(409, 'User is already a member');
    }

    return prisma.teamMember.create({
      data: {
        teamId,
        userId: data.userId,
        role: data.role,
      },
      include: {
        user: {
          select: { id: true, email: true, name: true, avatarUrl: true },
        },
      },
    });
  },

  async removeMember(teamId: string, userId: string, memberUserId: string) {
    const team = await this.getTeamById(teamId, userId);
    const member = team.members.find((m) => m.userId === userId);

    if (!member || (member.role !== TeamRole.OWNER && member.role !== TeamRole.ADMIN)) {
      throw new ApiError(403, 'Not authorized to remove members');
    }

    if (memberUserId === team.ownerId) {
      throw new ApiError(400, 'Cannot remove the team owner');
    }

    await prisma.teamMember.delete({
      where: { teamId_userId: { teamId, userId: memberUserId } },
    });
  },

  async updateMemberRole(teamId: string, userId: string, memberUserId: string, role: TeamRole) {
    const team = await this.getTeamById(teamId, userId);

    if (team.ownerId !== userId) {
      throw new ApiError(403, 'Only the owner can change roles');
    }

    if (memberUserId === team.ownerId) {
      throw new ApiError(400, 'Cannot change the owner role');
    }

    return prisma.teamMember.update({
      where: { teamId_userId: { teamId, userId: memberUserId } },
      data: { role },
    });
  },

  async getTeamAgents(teamId: string, userId: string) {
    await this.getTeamById(teamId, userId);

    return prisma.agent.findMany({
      where: { teamId, deletedAt: null },
      include: { tools: true },
    });
  },
};
