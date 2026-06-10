import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { router, authProcedure } from "../trpc.js";

const createWorkflowSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
  trigger: z.enum(["manual", "scheduled", "webhook"]).default("manual"),
  steps: z.array(
    z.object({
      id: z.string().optional(),
      type: z.string(),
      config: z.record(z.unknown()).default({}),
      dependsOn: z.array(z.string()).default([]),
    })
  ).default([]),
  config: z.record(z.unknown()).default({}),
});

const updateWorkflowSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  trigger: z.enum(["manual", "scheduled", "webhook"]).optional(),
  steps: z
    .array(
      z.object({
        id: z.string().optional(),
        type: z.string(),
        config: z.record(z.unknown()).default({}),
        dependsOn: z.array(z.string()).default([]),
      })
    )
    .optional(),
  config: z.record(z.unknown()).optional(),
});

interface WorkflowStep {
  id: string;
  type: string;
  config: Record<string, unknown>;
  dependsOn: string[];
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: "manual" | "scheduled" | "webhook";
  steps: WorkflowStep[];
  config: Record<string, unknown>;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface WorkflowRun {
  id: string;
  workflowId: string;
  inputData: Record<string, unknown>;
  trigger: string;
  status: "pending" | "running" | "completed" | "failed";
  stepResults: { stepId: string; status: string; output?: unknown; error?: string }[];
  userId: string;
  createdAt: string;
  completedAt?: string;
}

const workflows = new Map<string, Workflow>();
const workflowRuns = new Map<string, WorkflowRun>();

function paginate<T>(items: T[], page: number, limit: number): { items: T[]; total: number; page: number; limit: number; totalPages: number } {
  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const paged = items.slice(start, start + limit);
  return { items: paged, total, page, limit, totalPages };
}

export const workflowRouter = router({
  list: authProcedure
    .input(z.object({ search: z.string().optional(), page: z.number().default(1), limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      let list = Array.from(workflows.values()).filter((w) => w.userId === ctx.userId);
      if (input.search) {
        const lower = input.search.toLowerCase();
        list = list.filter((w) => w.name.toLowerCase().includes(lower) || w.description.toLowerCase().includes(lower));
      }
      return paginate(list, input.page, input.limit);
    }),

  getById: authProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const workflow = workflows.get(input.id);
      if (!workflow) throw new TRPCError({ code: "NOT_FOUND", message: "Workflow not found" });
      if (workflow.userId !== ctx.userId) throw new TRPCError({ code: "FORBIDDEN" });
      return workflow;
    }),

  create: authProcedure
    .input(createWorkflowSchema)
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString();
      const steps: WorkflowStep[] = input.steps.map((s) => ({
        ...s,
        id: s.id ?? nanoid(),
      }));
      const workflow: Workflow = {
        id: nanoid(),
        ...input,
        steps,
        userId: ctx.userId!,
        createdAt: now,
        updatedAt: now,
      };
      workflows.set(workflow.id, workflow);
      return workflow;
    }),

  update: authProcedure
    .input(updateWorkflowSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...fields } = input;
      const existing = workflows.get(id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Workflow not found" });
      if (existing.userId !== ctx.userId) throw new TRPCError({ code: "FORBIDDEN" });
      const steps = fields.steps
        ? fields.steps.map((s) => ({ ...s, id: s.id ?? nanoid() }))
        : existing.steps;
      const updated: Workflow = {
        ...existing,
        ...(fields as Partial<Workflow>),
        steps,
        updatedAt: new Date().toISOString(),
      };
      workflows.set(id, updated);
      return updated;
    }),

  delete: authProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = workflows.get(input.id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Workflow not found" });
      if (existing.userId !== ctx.userId) throw new TRPCError({ code: "FORBIDDEN" });
      workflows.delete(input.id);
      return { deleted: true, id: input.id };
    }),

  execute: authProcedure
    .input(
      z.object({
        id: z.string(),
        inputData: z.record(z.unknown()).default({}),
        trigger: z.string().default("manual"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const workflow = workflows.get(input.id);
      if (!workflow) throw new TRPCError({ code: "NOT_FOUND", message: "Workflow not found" });
      if (workflow.userId !== ctx.userId) throw new TRPCError({ code: "FORBIDDEN" });
      const now = new Date().toISOString();
      const stepResults = workflow.steps.map((step) => ({
        stepId: step.id,
        status: "completed" as const,
        output: `[Simulated] Step "${step.id}" (${step.type}) executed`,
      }));
      const run: WorkflowRun = {
        id: nanoid(),
        workflowId: input.id,
        inputData: input.inputData,
        trigger: input.trigger,
        status: "completed",
        stepResults,
        userId: ctx.userId!,
        createdAt: now,
        completedAt: now,
      };
      workflowRuns.set(run.id, run);
      return run;
    }),

  getRuns: authProcedure
    .input(
      z.object({
        workflowId: z.string(),
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const workflow = workflows.get(input.workflowId);
      if (!workflow) throw new TRPCError({ code: "NOT_FOUND", message: "Workflow not found" });
      if (workflow.userId !== ctx.userId) throw new TRPCError({ code: "FORBIDDEN" });
      const list = Array.from(workflowRuns.values())
        .filter((r) => r.workflowId === input.workflowId && r.userId === ctx.userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return paginate(list, input.page, input.limit);
    }),
});
