import { prisma } from '../config/database.js';
import { getQueueMetrics } from '../config/queue.js';
import { ApiError } from '../middleware/errorHandler.js';

export const analyticsService = {
  async getAgentAnalytics(agentId: string, userId: string) {
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, ownerId: userId, deletedAt: null },
    });

    if (!agent) {
      throw new ApiError(404, 'Agent not found');
    }

    const [totalExecutions, recentExecutions, averageDuration, totalCost] = await Promise.all([
      prisma.execution.count({ where: { agentId } }),
      prisma.execution.findMany({
        where: { agentId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          status: true,
          duration: true,
          createdAt: true,
          tokenUsage: true,
        },
      }),
      prisma.execution.aggregate({
        where: { agentId, status: 'completed' },
        _avg: { duration: true },
      }),
      prisma.execution.aggregate({
        where: { agentId },
        _sum: { cost: true },
      }),
    ]);

    const executionsByStatus = await prisma.execution.groupBy({
      by: ['status'],
      where: { agentId },
      _count: true,
    });

    const executionsByDay = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM executions
      WHERE agent_id = ${agentId}
        AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `;

    return {
      overview: {
        totalExecutions,
        averageDuration: averageDuration._avg.duration,
        totalCost: totalCost._sum.cost ?? 0,
      },
      recentExecutions,
      executionsByStatus: executionsByStatus.map((e: typeof executionsByStatus[0]) => ({
        status: e.status,
        count: e._count,
      })),
      executionsByDay: executionsByDay.map((e: typeof executionsByDay[0]) => ({
        date: e.date,
        count: Number(e.count),
      })),
    };
  },

  async getTeamAnalytics(teamId: string, userId: string) {
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        members: { some: { userId } },
        deletedAt: null,
      },
    });

    if (!team) {
      throw new ApiError(404, 'Team not found');
    }

    const [agentCount, memberCount, totalExecutions] = await Promise.all([
      prisma.agent.count({ where: { teamId, deletedAt: null } }),
      prisma.teamMember.count({ where: { teamId } }),
      prisma.execution.count({
        where: {
          agent: { teamId },
        },
      }),
    ]);

    return {
      teamId,
      agentCount,
      memberCount,
      totalExecutions,
    };
  },

  async getSystemAnalytics() {
    const [
      totalUsers,
      totalAgents,
      totalExecutions,
      totalTeams,
      totalTools,
      totalWorkflows,
      queueMetrics,
      recentErrors,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.agent.count({ where: { deletedAt: null } }),
      prisma.execution.count(),
      prisma.team.count({ where: { deletedAt: null } }),
      prisma.tool.count({ where: { deletedAt: null } }),
      prisma.workflow.count({ where: { deletedAt: null } }),
      getQueueMetrics(),
      prisma.execution.count({
        where: {
          status: 'failed',
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return {
      users: totalUsers,
      agents: totalAgents,
      executions: totalExecutions,
      teams: totalTeams,
      tools: totalTools,
      workflows: totalWorkflows,
      queues: queueMetrics,
      errors24h: recentErrors,
    };
  },

  async getUsageReport(
    userId: string,
    params: { from?: string; to?: string; granularity?: string },
  ) {
    const from = params.from
      ? new Date(params.from)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = params.to ? new Date(params.to) : new Date();

    const executions = await prisma.execution.findMany({
      where: {
        ownerId: userId,
        createdAt: { gte: from, lte: to },
      },
      orderBy: { createdAt: 'asc' },
    });

    const totalTokens = executions.reduce((sum: number, e: typeof executions[0]) => {
      const usage = e.tokenUsage as { totalTokens?: number } | null;
      return sum + (usage?.totalTokens ?? 0);
    }, 0);

    const totalCost = executions.reduce((sum: number, e: typeof executions[0]) => sum + (e.cost ?? 0), 0);

    return {
      period: { from, to },
      summary: {
        totalExecutions: executions.length,
        totalTokens,
        totalCost,
        averageTokensPerExecution:
          executions.length > 0 ? Math.round(totalTokens / executions.length) : 0,
      },
      executionsByType: {
        agent: executions.filter((e: typeof executions[0]) => e.type === 'agent').length,
        workflow: executions.filter((e: typeof executions[0]) => e.type === 'workflow').length,
        tool: executions.filter((e: typeof executions[0]) => e.type === 'tool').length,
      },
      executionsByStatus: {
        completed: executions.filter((e: typeof executions[0]) => e.status === 'completed').length,
        failed: executions.filter((e: typeof executions[0]) => e.status === 'failed').length,
        running: executions.filter((e: typeof executions[0]) => e.status === 'running').length,
        pending: executions.filter((e: typeof executions[0]) => e.status === 'pending').length,
        cancelled: executions.filter((e: typeof executions[0]) => e.status === 'cancelled').length,
      },
    };
  },

  async getCostReport(userId: string, params: { from?: string; to?: string }) {
    const from = params.from
      ? new Date(params.from)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = params.to ? new Date(params.to) : new Date();

    const executions = await prisma.execution.findMany({
      where: {
        ownerId: userId,
        createdAt: { gte: from, lte: to },
      },
      select: {
        cost: true,
        tokenUsage: true,
        createdAt: true,
        type: true,
      },
    });

    const totalCost = executions.reduce((sum: number, e: typeof executions[0]) => sum + (e.cost ?? 0), 0);
    const costByType = executions.reduce(
      (acc: Record<string, number>, e: typeof executions[0]) => {
        const type = e.type as string;
        acc[type] = (acc[type] ?? 0) + (e.cost ?? 0);
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      period: { from, to },
      totalCost,
      costByType,
      executionCount: executions.length,
    };
  },
};
