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

vi.mock("nanoid", () => ({
  nanoid: vi.fn(() => "test-id"),
}));

describe("AgentWorker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should initialize without error", async () => {
    const { AgentWorker } = await import("../src/workers/agent-worker.js");
    const worker = new AgentWorker();
    expect(worker).toBeInstanceOf(AgentWorker);
    expect(worker).toHaveProperty("close");
    await worker.close();
  });

  it("should publish progress events during processing", async () => {
    const Redis = (await import("ioredis")).default;
    const mockRedis = new Redis();

    const { AgentWorker } = await import("../src/workers/agent-worker.js");
    const worker = new AgentWorker();

    const job: any = {
      id: "job-1",
      data: {
        executionId: "exec-1",
        agentId: "agent-1",
        userId: "user-1",
        input: "Test input for the agent",
      },
      isActive: vi.fn().mockResolvedValue(true),
      updateProgress: vi.fn().mockResolvedValue(undefined),
    };

    const processor = (Worker as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1];
    await processor(job);

    expect(mockRedis.publish).toHaveBeenCalled();
    const publishCalls = (mockRedis.publish as ReturnType<typeof vi.fn>).mock.calls;
    expect(publishCalls.length).toBeGreaterThanOrEqual(1);

    const firstCall = JSON.parse(publishCalls[0][1]);
    expect(firstCall.executionId).toBe("exec-1");
    expect(firstCall.status).toBe("running");

    await worker.close();
  });

  it("should emit completion event on successful processing", async () => {
    const Redis = (await import("ioredis")).default;
    const mockRedis = new Redis();

    const { AgentWorker } = await import("../src/workers/agent-worker.js");
    const worker = new AgentWorker();

    const job: any = {
      id: "job-2",
      data: {
        executionId: "exec-2",
        agentId: "agent-2",
        userId: "user-2",
        input: "Another test",
      },
      isActive: vi.fn().mockResolvedValue(true),
      updateProgress: vi.fn().mockResolvedValue(undefined),
    };

    const processor = (Worker as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1];
    await processor(job);

    const publishCalls = (mockRedis.publish as ReturnType<typeof vi.fn>).mock.calls;
    const completedEvent = publishCalls.find((call: any[]) => {
      const msg = JSON.parse(call[1]);
      return msg.status === "completed";
    });

    expect(completedEvent).toBeDefined();
    const msg = JSON.parse(completedEvent[1]);
    expect(msg.executionId).toBe("exec-2");
    expect(msg.status).toBe("completed");
    expect(msg.output).toContain("Successfully processed");

    await worker.close();
  });

  it("should publish failure event when processing throws", async () => {
    const Redis = (await import("ioredis")).default;
    const mockRedis = new Redis();

    const { AgentWorker } = await import("../src/workers/agent-worker.js");
    const worker = new AgentWorker();

    const job: any = {
      id: "job-3",
      data: {
        executionId: "exec-3",
        agentId: "agent-3",
        userId: "user-3",
        input: "Failing job",
      },
      isActive: vi.fn().mockRejectedValue(new Error("Simulated failure")),
      updateProgress: vi.fn().mockResolvedValue(undefined),
    };

    const processor = (Worker as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1];
    await expect(processor(job)).rejects.toThrow("Simulated failure");

    const publishCalls = (mockRedis.publish as ReturnType<typeof vi.fn>).mock.calls;
    const failedEvent = publishCalls.find((call: any[]) => {
      const msg = JSON.parse(call[1]);
      return msg.status === "failed";
    });

    expect(failedEvent).toBeDefined();
    const msg = JSON.parse(failedEvent[1]);
    expect(msg.executionId).toBe("exec-3");
    expect(msg.status).toBe("failed");
    expect(msg.error).toBe("Simulated failure");

    await worker.close();
  });

  it("should handle cancellation by checking isActive", async () => {
    const Redis = (await import("ioredis")).default;
    const mockRedis = new Redis();

    const { AgentWorker } = await import("../src/workers/agent-worker.js");
    const worker = new AgentWorker();

    let callCount = 0;
    const job: any = {
      id: "job-4",
      data: {
        executionId: "exec-4",
        agentId: "agent-4",
        userId: "user-4",
        input: "Cancellable job",
      },
      isActive: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount >= 2) return false;
        return true;
      }),
      updateProgress: vi.fn().mockResolvedValue(undefined),
    };

    const processor = (Worker as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1];
    await processor(job);

    expect(job.updateProgress).toHaveBeenCalledTimes(1);

    await worker.close();
  });
});
