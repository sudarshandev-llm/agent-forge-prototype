import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("ioredis", () => {
  const mockRedis = {
    publish: vi.fn().mockResolvedValue(0),
    ping: vi.fn().mockResolvedValue("PONG"),
    quit: vi.fn().mockResolvedValue("OK"),
    on: vi.fn(),
  };
  return {
    default: vi.fn(() => mockRedis),
  };
});

vi.mock("../src/config/logger.js", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("bullmq", async () => {
  const actual = await vi.importActual("bullmq");
  return {
    ...actual,
    Worker: vi.fn().mockImplementation((queueName, processor, opts) => {
      return {
        queueName,
        processor,
        opts,
        on: vi.fn().mockReturnThis(),
        close: vi.fn().mockResolvedValue(undefined),
      };
    }),
    Queue: vi.fn().mockImplementation(() => ({
      add: vi.fn().mockResolvedValue({ id: "mock-job-id" }),
      close: vi.fn().mockResolvedValue(undefined),
      on: vi.fn().mockReturnThis(),
    })),
    QueueEvents: vi.fn().mockImplementation(() => ({
      on: vi.fn().mockReturnThis(),
      close: vi.fn().mockResolvedValue(undefined),
    })),
  };
});

describe("WorkflowWorker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should initialize without error", async () => {
    const { WorkflowWorker } = await import("../src/workers/workflow-worker.js");
    const worker = new WorkflowWorker();
    expect(worker).toBeInstanceOf(WorkflowWorker);
    expect(worker).toHaveProperty("close");
    await worker.close();
  });

  it("should process a simple linear workflow", async () => {
    const { WorkflowWorker, NodeType } = await import("../src/workers/workflow-worker.js");

    const worker = new WorkflowWorker();

    const job: any = {
      id: "wf-job-1",
      data: {
        executionId: "wf-exec-1",
        workflowId: "wf-1",
        userId: "user-1",
        triggerData: { query: "Hello workflow" },
        nodes: [
          { id: "trigger-1", type: "trigger" as NodeType, label: "Start", config: {} },
          { id: "agent-1", type: "agent" as NodeType, label: "Process", config: { prompt: "Process: {{triggerData.query}}" } },
          { id: "end-1", type: "end" as NodeType, label: "End", config: {} },
        ],
        edges: [
          { id: "e1", source: "trigger-1", target: "agent-1" },
          { id: "e2", source: "agent-1", target: "end-1" },
        ],
      },
      isActive: vi.fn().mockResolvedValue(true),
      updateProgress: vi.fn().mockResolvedValue(undefined),
    };

    const processor = (Worker as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1];
    const result = await processor(job);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.results).toHaveLength(3);

    expect(result.results[0].nodeType).toBe("trigger");
    expect(result.results[0].status).toBe("success");

    expect(result.results[1].nodeType).toBe("agent");
    expect(result.results[1].status).toBe("success");

    expect(result.results[2].nodeType).toBe("end");
    expect(result.results[2].status).toBe("success");

    await worker.close();
  });

  it("should handle conditional branching", async () => {
    const { WorkflowWorker, NodeType } = await import("../src/workers/workflow-worker.js");

    const worker = new WorkflowWorker();

    const job: any = {
      id: "wf-job-2",
      data: {
        executionId: "wf-exec-2",
        workflowId: "wf-2",
        userId: "user-2",
        triggerData: { value: 42 },
        nodes: [
          { id: "trigger-1", type: "trigger" as NodeType, label: "Start", config: {} },
          { id: "cond-1", type: "condition" as NodeType, label: "Check value", config: { expression: "triggerData.value > 10" } },
          { id: "agent-1", type: "agent" as NodeType, label: "High path", config: { prompt: "Value is high" } },
          { id: "agent-2", type: "agent" as NodeType, label: "Low path", config: { prompt: "Value is low" } },
          { id: "end-1", type: "end" as NodeType, label: "End", config: {} },
        ],
        edges: [
          { id: "e1", source: "trigger-1", target: "cond-1" },
          { id: "e2", source: "cond-1", target: "agent-1", condition: "triggerData.value > 10" },
          { id: "e3", source: "cond-1", target: "agent-2", condition: "triggerData.value <= 10" },
          { id: "e4", source: "agent-1", target: "end-1" },
          { id: "e5", source: "agent-2", target: "end-1" },
        ],
      },
      isActive: vi.fn().mockResolvedValue(true),
      updateProgress: vi.fn().mockResolvedValue(undefined),
    };

    const processor = (Worker as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1];
    const result = await processor(job);

    expect(result.success).toBe(true);
    expect(result.results.length).toBeGreaterThanOrEqual(3);

    const agentResults = result.results.filter((r: any) => r.nodeType === "agent");
    expect(agentResults.length).toBe(1);
    expect(agentResults[0].nodeId).toBe("agent-1");

    await worker.close();
  });

  it("should handle node execution failures gracefully", async () => {
    const { WorkflowWorker, NodeType } = await import("../src/workers/workflow-worker.js");

    const worker = new WorkflowWorker();

    const job: any = {
      id: "wf-job-3",
      data: {
        executionId: "wf-exec-3",
        workflowId: "wf-3",
        userId: "user-3",
        triggerData: {},
        nodes: [
          { id: "trigger-1", type: "trigger" as NodeType, label: "Start", config: {} },
          {
            id: "agent-1",
            type: "agent" as NodeType,
            label: "Failing agent",
            config: { prompt: "{{missing.reference}}", shouldThrow: true },
          },
        ],
        edges: [
          { id: "e1", source: "trigger-1", target: "agent-1" },
        ],
      },
      isActive: vi.fn().mockResolvedValue(true),
      updateProgress: vi.fn().mockResolvedValue(undefined),
    };

    const processor = (Worker as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1];
    const result = await processor(job);

    expect(result.success).toBe(false);
    const failedResult = result.results.find((r: any) => r.nodeType === "agent");
    expect(failedResult).toBeDefined();
    expect(failedResult.status).toBe("success");

    await worker.close();
  });

  it("should publish progress events during workflow execution", async () => {
    const Redis = (await import("ioredis")).default;
    const mockRedis = new Redis();

    const { WorkflowWorker, NodeType } = await import("../src/workers/workflow-worker.js");

    const worker = new WorkflowWorker();

    const job: any = {
      id: "wf-job-4",
      data: {
        executionId: "wf-exec-4",
        workflowId: "wf-4",
        userId: "user-4",
        triggerData: { input: "test" },
        nodes: [
          { id: "trigger-1", type: "trigger" as NodeType, label: "Start", config: {} },
          { id: "end-1", type: "end" as NodeType, label: "End", config: {} },
        ],
        edges: [
          { id: "e1", source: "trigger-1", target: "end-1" },
        ],
      },
      isActive: vi.fn().mockResolvedValue(true),
      updateProgress: vi.fn().mockResolvedValue(undefined),
    };

    const processor = (Worker as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1];
    await processor(job);

    expect(mockRedis.publish).toHaveBeenCalled();
    const publishCalls = (mockRedis.publish as ReturnType<typeof vi.fn>).mock.calls;

    const startEvent = publishCalls.find((call: any[]) => {
      const msg = JSON.parse(call[1]);
      return msg.status === "running" && !msg.currentNode;
    });
    expect(startEvent).toBeDefined();

    const endEvent = publishCalls.find((call: any[]) => {
      const msg = JSON.parse(call[1]);
      return msg.status === "completed" || msg.status === "failed";
    });
    expect(endEvent).toBeDefined();

    await worker.close();
  });

  it("should execute tool nodes", async () => {
    const { WorkflowWorker, NodeType } = await import("../src/workers/workflow-worker.js");

    const worker = new WorkflowWorker();

    const job: any = {
      id: "wf-job-5",
      data: {
        executionId: "wf-exec-5",
        workflowId: "wf-5",
        userId: "user-5",
        triggerData: {},
        nodes: [
          { id: "trigger-1", type: "trigger" as NodeType, label: "Start", config: {} },
          { id: "tool-1", type: "tool" as NodeType, label: "Web search", config: { toolId: "web-search", query: "hello" } },
          { id: "end-1", type: "end" as NodeType, label: "End", config: {} },
        ],
        edges: [
          { id: "e1", source: "trigger-1", target: "tool-1" },
          { id: "e2", source: "tool-1", target: "end-1" },
        ],
      },
      isActive: vi.fn().mockResolvedValue(true),
      updateProgress: vi.fn().mockResolvedValue(undefined),
    };

    const processor = (Worker as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1];
    const result = await processor(job);

    expect(result.success).toBe(true);
    const toolResult = result.results.find((r: any) => r.nodeType === "tool");
    expect(toolResult).toBeDefined();
    expect(toolResult.status).toBe("success");
    expect(toolResult.output).toHaveProperty("toolResult");

    await worker.close();
  });
});
