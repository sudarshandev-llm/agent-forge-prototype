import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { router, authProcedure } from "../trpc.js";

const agentMemoryConfigSchema = z.object({
  type: z.enum(["conversation", "vector", "both"]),
  maxMessages: z.number().optional(),
});

const createAgentSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
  systemPrompt: z.string().default(""),
  model: z.string().default("gpt-4"),
  provider: z.enum(["openai", "anthropic", "google", "groq"]).default("openai"),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(128000).default(2048),
  memoryConfig: agentMemoryConfigSchema.optional(),
  tools: z.array(z.string()).default([]),
  role: z.enum(["leader", "researcher", "executor", "reviewer"]).default("executor"),
  teamId: z.string().optional(),
});

const updateAgentSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  systemPrompt: z.string().optional(),
  model: z.string().optional(),
  provider: z.enum(["openai", "anthropic", "google", "groq"]).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(128000).optional(),
  memoryConfig: agentMemoryConfigSchema.optional(),
  tools: z.array(z.string()).optional(),
  role: z.enum(["leader", "researcher", "executor", "reviewer"]).optional(),
  teamId: z.string().optional(),
});

const paginationSchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(20),
});

interface Agent {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  model: string;
  provider: "openai" | "anthropic" | "google" | "groq";
  temperature: number;
  maxTokens: number;
  memoryConfig?: { type: "conversation" | "vector" | "both"; maxMessages?: number };
  tools: string[];
  role: "leader" | "researcher" | "executor" | "reviewer";
  teamId?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface AgentExecution {
  id: string;
  agentId: string;
  input: string;
  output?: string;
  status: "running" | "completed" | "failed";
  userId: string;
  createdAt: string;
  completedAt?: string;
}

const agents = new Map<string, Agent>();
const executions = new Map<string, AgentExecution>();

function paginate<T>(items: T[], page: number, limit: number): { items: T[]; total: number; page: number; limit: number; totalPages: number } {
  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const paged = items.slice(start, start + limit);
  return { items: paged, total, page, limit, totalPages };
}

export const agentRouter = router({
  list: authProcedure
    .input(
      z.object({
        status: z.string().optional(),
        search: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { search, page, limit } = input;
      let list = Array.from(agents.values()).filter((a) => a.userId === ctx.userId);
      if (search) {
        const lower = search.toLowerCase();
        list = list.filter((a) => a.name.toLowerCase().includes(lower) || a.description.toLowerCase().includes(lower));
      }
      return paginate(list, page, limit);
    }),

  getById: authProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const agent = agents.get(input.id);
      if (!agent) throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
      if (agent.userId !== ctx.userId) throw new TRPCError({ code: "FORBIDDEN" });
      return agent;
    }),

  create: authProcedure
    .input(createAgentSchema)
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString();
      const agent: Agent = {
        id: nanoid(),
        ...input,
        userId: ctx.userId!,
        createdAt: now,
        updatedAt: now,
      };
      agents.set(agent.id, agent);
      return agent;
    }),

  update: authProcedure
    .input(updateAgentSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...fields } = input;
      const existing = agents.get(id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
      if (existing.userId !== ctx.userId) throw new TRPCError({ code: "FORBIDDEN" });
      const updated: Agent = {
        ...existing,
        ...(fields as Partial<Agent>),
        updatedAt: new Date().toISOString(),
      };
      agents.set(id, updated);
      return updated;
    }),

  delete: authProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = agents.get(input.id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
      if (existing.userId !== ctx.userId) throw new TRPCError({ code: "FORBIDDEN" });
      agents.delete(input.id);
      return { deleted: true, id: input.id };
    }),

  run: authProcedure
    .input(
      z.object({
        id: z.string(),
        input: z.string(),
        stream: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const agent = agents.get(input.id);
      if (!agent) throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
      if (agent.userId !== ctx.userId) throw new TRPCError({ code: "FORBIDDEN" });
      const now = new Date().toISOString();
      const execution: AgentExecution = {
        id: nanoid(),
        agentId: input.id,
        input: input.input,
        output: `[Simulated] ${agent.name} processed: "${input.input}"`,
        status: "completed",
        userId: ctx.userId!,
        createdAt: now,
        completedAt: now,
      };
      executions.set(execution.id, execution);
      return execution;
    }),

  getExecutions: authProcedure
    .input(
      z.object({
        agentId: z.string(),
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const agent = agents.get(input.agentId);
      if (!agent) throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
      if (agent.userId !== ctx.userId) throw new TRPCError({ code: "FORBIDDEN" });
      const list = Array.from(executions.values())
        .filter((e) => e.agentId === input.agentId && e.userId === ctx.userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return paginate(list, input.page, input.limit);
    }),
});
