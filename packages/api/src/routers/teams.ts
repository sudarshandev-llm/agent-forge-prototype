import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { nanoid } from 'nanoid';
import { router, authProcedure } from '../trpc.js';

const createTeamSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(''),
  agentIds: z.array(z.string()).default([]),
});

const updateTeamSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  agentIds: z.array(z.string()).optional(),
});

export interface TeamMember {
  userId: string;
  role: string;
  joinedAt: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  agentIds: string[];
  members: TeamMember[];
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamRunResult {
  id: string;
  teamId: string;
  input: string;
  outputs: { agentId: string; output: string }[];
  status: 'running' | 'completed' | 'failed';
  userId: string;
  createdAt: string;
  completedAt?: string;
}

const teams = new Map<string, Team>();
const teamRuns = new Map<string, TeamRunResult>();

function paginate<T>(
  items: T[],
  page: number,
  limit: number,
): { items: T[]; total: number; page: number; limit: number; totalPages: number } {
  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const paged = items.slice(start, start + limit);
  return { items: paged, total, page, limit, totalPages };
}

export const teamRouter = router({
  list: authProcedure
    .input(
      z.object({
        search: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      let list = Array.from(teams.values()).filter(
        (t) => t.ownerId === ctx.userId || t.members.some((m) => m.userId === ctx.userId),
      );
      if (input.search) {
        const lower = input.search.toLowerCase();
        list = list.filter(
          (t) =>
            t.name.toLowerCase().includes(lower) || t.description.toLowerCase().includes(lower),
        );
      }
      return paginate(list, input.page, input.limit);
    }),

  getById: authProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const team = teams.get(input.id);
    if (!team) throw new TRPCError({ code: 'NOT_FOUND', message: 'Team not found' });
    const isMember =
      team.ownerId === ctx.userId || team.members.some((m) => m.userId === ctx.userId);
    if (!isMember) throw new TRPCError({ code: 'FORBIDDEN' });
    return team;
  }),

  create: authProcedure.input(createTeamSchema).mutation(async ({ ctx, input }) => {
    const now = new Date().toISOString();
    const team: Team = {
      id: nanoid(),
      ...input,
      members: [],
      ownerId: ctx.userId!,
      createdAt: now,
      updatedAt: now,
    };
    teams.set(team.id, team);
    return team;
  }),

  update: authProcedure.input(updateTeamSchema).mutation(async ({ ctx, input }) => {
    const { id, ...fields } = input;
    const existing = teams.get(id);
    if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Team not found' });
    if (existing.ownerId !== ctx.userId) throw new TRPCError({ code: 'FORBIDDEN' });
    const updated: Team = {
      ...existing,
      ...(fields as Partial<Team>),
      updatedAt: new Date().toISOString(),
    };
    teams.set(id, updated);
    return updated;
  }),

  delete: authProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const existing = teams.get(input.id);
    if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Team not found' });
    if (existing.ownerId !== ctx.userId) throw new TRPCError({ code: 'FORBIDDEN' });
    teams.delete(input.id);
    return { deleted: true, id: input.id };
  }),

  addMember: authProcedure
    .input(z.object({ teamId: z.string(), userId: z.string(), role: z.string().default('member') }))
    .mutation(async ({ ctx, input }) => {
      const team = teams.get(input.teamId);
      if (!team) throw new TRPCError({ code: 'NOT_FOUND', message: 'Team not found' });
      if (team.ownerId !== ctx.userId) throw new TRPCError({ code: 'FORBIDDEN' });
      if (team.members.some((m) => m.userId === input.userId)) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Member already exists' });
      }
      const member: TeamMember = {
        userId: input.userId,
        role: input.role,
        joinedAt: new Date().toISOString(),
      };
      team.members.push(member);
      teams.set(team.id, team);
      return team;
    }),

  removeMember: authProcedure
    .input(z.object({ teamId: z.string(), userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const team = teams.get(input.teamId);
      if (!team) throw new TRPCError({ code: 'NOT_FOUND', message: 'Team not found' });
      if (team.ownerId !== ctx.userId) throw new TRPCError({ code: 'FORBIDDEN' });
      const idx = team.members.findIndex((m) => m.userId === input.userId);
      if (idx === -1) throw new TRPCError({ code: 'NOT_FOUND', message: 'Member not found' });
      team.members.splice(idx, 1);
      teams.set(team.id, team);
      return team;
    }),

  run: authProcedure
    .input(z.object({ teamId: z.string(), input: z.string(), stream: z.boolean().default(false) }))
    .mutation(async ({ ctx, input }) => {
      const team = teams.get(input.teamId);
      if (!team) throw new TRPCError({ code: 'NOT_FOUND', message: 'Team not found' });
      const isMember =
        team.ownerId === ctx.userId || team.members.some((m) => m.userId === ctx.userId);
      if (!isMember) throw new TRPCError({ code: 'FORBIDDEN' });
      const now = new Date().toISOString();
      const outputs = team.agentIds.map((agentId) => ({
        agentId,
        output: `[Simulated] Agent ${agentId} processed team input: "${input.input}"`,
      }));
      const run: TeamRunResult = {
        id: nanoid(),
        teamId: input.teamId,
        input: input.input,
        outputs,
        status: 'completed',
        userId: ctx.userId!,
        createdAt: now,
        completedAt: now,
      };
      teamRuns.set(run.id, run);
      return run;
    }),
});
