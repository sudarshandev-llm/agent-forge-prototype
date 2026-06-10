import { describe, it, expect, beforeEach } from "vitest";
import { agentRouter } from "../src/routers/agents.js";
import { type TRPCContext } from "../src/trpc.js";

function createCtx(overrides?: Partial<TRPCContext>): TRPCContext {
  return {
    userId: "user-1",
    user: { id: "user-1", email: "test@test.com", name: "Test User", roles: ["user"] },
    headers: {},
    ...overrides,
  };
}

function createAdminCtx(): TRPCContext {
  return createCtx({
    user: { id: "user-admin", email: "admin@test.com", name: "Admin", roles: ["user", "admin"] },
  });
}

const caller = (ctx: TRPCContext) =>
  agentRouter.createCaller(ctx);

describe("agentRouter", () => {
  beforeEach(() => {
    // Each test gets a fresh state since modules are reloaded by vitest
  });

  describe("auth middleware", () => {
    it("should reject unauthenticated requests", async () => {
      const ctx = createCtx({ userId: undefined });
      await expect(caller(ctx).list({ page: 1, limit: 20 })).rejects.toThrow("UNAUTHORIZED");
    });

    it("should reject unauthenticated requests on create", async () => {
      const ctx = createCtx({ userId: undefined });
      await expect(caller(ctx).create({ name: "Test" })).rejects.toThrow("UNAUTHORIZED");
    });
  });

  describe("list", () => {
    it("should return empty list when no agents exist", async () => {
      const ctx = createCtx();
      const result = await caller(ctx).list({ page: 1, limit: 20 });
      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.page).toBe(1);
    });

    it("should return paginated agents", async () => {
      const ctx = createCtx();
      const agent1 = await caller(ctx).create({ name: "Agent Alpha" });
      const agent2 = await caller(ctx).create({ name: "Agent Beta" });
      const agent3 = await caller(ctx).create({ name: "Agent Gamma" });

      const page1 = await caller(ctx).list({ page: 1, limit: 2 });
      expect(page1.items).toHaveLength(2);
      expect(page1.total).toBe(3);
      expect(page1.totalPages).toBe(2);

      const page2 = await caller(ctx).list({ page: 2, limit: 2 });
      expect(page2.items).toHaveLength(1);
    });

    it("should filter by search", async () => {
      const ctx = createCtx();
      await caller(ctx).create({ name: "Alpha Agent", description: "does something" });
      await caller(ctx).create({ name: "Beta Agent", description: "alpha related" });
      await caller(ctx).create({ name: "Gamma Tool", description: "completely different" });

      const result = await caller(ctx).list({ search: "alpha", page: 1, limit: 20 });
      expect(result.items).toHaveLength(2);
      expect(result.items.map((a) => a.name)).toContain("Alpha Agent");
      expect(result.items.map((a) => a.name)).toContain("Beta Agent");
    });

    it("should only return agents owned by the user", async () => {
      const ctx1 = createCtx();
      const ctx2 = createCtx({ userId: "user-2", user: { id: "user-2", email: "other@test.com", name: "Other", roles: ["user"] } });

      await caller(ctx1).create({ name: "My Agent" });
      await caller(ctx2).create({ name: "Other Agent" });

      const result = await caller(ctx1).list({ page: 1, limit: 20 });
      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.name).toBe("My Agent");
    });
  });

  describe("create", () => {
    it("should create an agent with default values", async () => {
      const ctx = createCtx();
      const agent = await caller(ctx).create({ name: "My Agent" });
      expect(agent.id).toBeDefined();
      expect(agent.name).toBe("My Agent");
      expect(agent.description).toBe("");
      expect(agent.model).toBe("gpt-4");
      expect(agent.provider).toBe("openai");
      expect(agent.temperature).toBe(0.7);
      expect(agent.maxTokens).toBe(2048);
      expect(agent.role).toBe("executor");
      expect(agent.tools).toEqual([]);
      expect(agent.userId).toBe("user-1");
    });

    it("should create an agent with custom values", async () => {
      const ctx = createCtx();
      const agent = await caller(ctx).create({
        name: "Researcher",
        description: "Research agent",
        systemPrompt: "You are a researcher",
        model: "claude-3-opus",
        provider: "anthropic",
        temperature: 0.3,
        maxTokens: 4096,
        tools: ["web-search", "document-reader"],
        role: "researcher",
      });
      expect(agent.name).toBe("Researcher");
      expect(agent.provider).toBe("anthropic");
      expect(agent.temperature).toBe(0.3);
      expect(agent.role).toBe("researcher");
    });

    it("should reject empty name", async () => {
      const ctx = createCtx();
      await expect(caller(ctx).create({ name: "" })).rejects.toThrow();
    });

    it("should reject invalid temperature", async () => {
      const ctx = createCtx();
      await expect(caller(ctx).create({ name: "Test", temperature: 3 })).rejects.toThrow();
      await expect(caller(ctx).create({ name: "Test", temperature: -1 })).rejects.toThrow();
    });

    it("should reject invalid provider", async () => {
      const ctx = createCtx();
      await expect(
        caller(ctx).create({ name: "Test", provider: "invalid" as never })
      ).rejects.toThrow();
    });
  });

  describe("getById", () => {
    it("should return an agent by id", async () => {
      const ctx = createCtx();
      const created = await caller(ctx).create({ name: "My Agent" });
      const found = await caller(ctx).getById({ id: created.id });
      expect(found.id).toBe(created.id);
      expect(found.name).toBe("My Agent");
    });

    it("should throw NOT_FOUND for non-existent id", async () => {
      const ctx = createCtx();
      await expect(caller(ctx).getById({ id: "non-existent" })).rejects.toThrow("NOT_FOUND");
    });

    it("should throw FORBIDDEN for another user's agent", async () => {
      const ctx1 = createCtx();
      const ctx2 = createCtx({ userId: "user-2", user: { id: "user-2", email: "other@test.com", name: "Other", roles: ["user"] } });
      const created = await caller(ctx1).create({ name: "My Agent" });
      await expect(caller(ctx2).getById({ id: created.id })).rejects.toThrow("FORBIDDEN");
    });
  });

  describe("update", () => {
    it("should update an agent", async () => {
      const ctx = createCtx();
      const created = await caller(ctx).create({ name: "Original" });
      const updated = await caller(ctx).update({ id: created.id, name: "Updated", temperature: 0.5 });
      expect(updated.name).toBe("Updated");
      expect(updated.temperature).toBe(0.5);
      expect(updated.id).toBe(created.id);
    });

    it("should throw NOT_FOUND for non-existent id", async () => {
      const ctx = createCtx();
      await expect(caller(ctx).update({ id: "non-existent", name: "Nope" })).rejects.toThrow("NOT_FOUND");
    });

    it("should throw FORBIDDEN for another user's agent", async () => {
      const ctx1 = createCtx();
      const ctx2 = createCtx({ userId: "user-2", user: { id: "user-2", email: "other@test.com", name: "Other", roles: ["user"] } });
      const created = await caller(ctx1).create({ name: "My Agent" });
      await expect(caller(ctx2).update({ id: created.id, name: "Hacked" })).rejects.toThrow("FORBIDDEN");
    });
  });

  describe("delete", () => {
    it("should delete an agent", async () => {
      const ctx = createCtx();
      const created = await caller(ctx).create({ name: "Delete Me" });
      const result = await caller(ctx).delete({ id: created.id });
      expect(result.deleted).toBe(true);
      expect(result.id).toBe(created.id);
      await expect(caller(ctx).getById({ id: created.id })).rejects.toThrow("NOT_FOUND");
    });

    it("should throw NOT_FOUND for non-existent id", async () => {
      const ctx = createCtx();
      await expect(caller(ctx).delete({ id: "non-existent" })).rejects.toThrow("NOT_FOUND");
    });
  });

  describe("run", () => {
    it("should run an agent and return execution result", async () => {
      const ctx = createCtx();
      const created = await caller(ctx).create({ name: "Runner" });
      const result = await caller(ctx).run({ id: created.id, input: "Hello" });
      expect(result.status).toBe("completed");
      expect(result.agentId).toBe(created.id);
      expect(result.input).toBe("Hello");
      expect(result.output).toContain("Runner");
    });

    it("should throw NOT_FOUND for non-existent agent", async () => {
      const ctx = createCtx();
      await expect(caller(ctx).run({ id: "non-existent", input: "Hello" })).rejects.toThrow("NOT_FOUND");
    });
  });

  describe("getExecutions", () => {
    it("should return executions for an agent", async () => {
      const ctx = createCtx();
      const created = await caller(ctx).create({ name: "Exec Agent" });
      await caller(ctx).run({ id: created.id, input: "First" });
      await caller(ctx).run({ id: created.id, input: "Second" });
      const result = await caller(ctx).getExecutions({ agentId: created.id, page: 1, limit: 20 });
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it("should throw NOT_FOUND for non-existent agent", async () => {
      const ctx = createCtx();
      await expect(caller(ctx).getExecutions({ agentId: "non-existent" })).rejects.toThrow("NOT_FOUND");
    });
  });
});
