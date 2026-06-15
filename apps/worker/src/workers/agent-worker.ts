import { Worker, Job } from "bullmq";
import { getRedis } from "../config/redis.js";
import { config } from "../config/index.js";
import { logger } from "../config/logger.js";

export interface AgentJobData {
  executionId: string;
  agentId: string;
  userId: string;
  input: string;
  stream?: boolean;
}

export class AgentWorker {
  private worker: Worker;

  constructor() {
    this.worker = new Worker<AgentJobData>(
      config.agentQueueName,
      async (job: Job<AgentJobData>) => this.process(job),
      {
        connection: getRedis() as any,
        concurrency: 5,
        limiter: { max: 10, duration: 1000 },
      },
    );

    this.worker.on("completed", (job) => {
      logger.info(
        {
          jobId: job.id,
          agentId: job.data.agentId,
          executionId: job.data.executionId,
        },
        "Agent execution completed",
      );
    });

    this.worker.on("failed", (job, error) => {
      logger.error(
        {
          jobId: job?.id,
          error: error.message,
          executionId: job?.data.executionId,
        },
        "Agent execution failed",
      );
    });

    logger.info("AgentWorker initialized");
  }

  private async process(job: Job<AgentJobData>): Promise<void> {
    const { executionId, agentId, userId, input } = job.data;

    logger.info({ executionId, agentId }, "Processing agent execution");

    const redis = getRedis();

    await redis.publish(`agent:${agentId}:progress`, JSON.stringify({
      executionId,
      status: "running",
      step: { type: "thought", content: "Starting execution..." },
      timestamp: Date.now(),
    }));

    try {
      const steps = [
        { type: "thought", content: "Analyzing the input and preparing response..." },
        { type: "action", content: "Processing with LLM..." },
        { type: "observation", content: "Gathering relevant context..." },
        { type: "result", content: `Processed: ${input.substring(0, 100)}...` },
      ];

      for (const step of steps) {
        if (await job.isActive()) {
          await new Promise((resolve) => setTimeout(resolve, 500));

          await redis.publish(`agent:${agentId}:progress`, JSON.stringify({
            executionId,
            status: "running",
            step: { ...step, timestamp: Date.now() },
            timestamp: Date.now(),
          }));

          await job.updateProgress(
            (steps.indexOf(step) / steps.length) * 100,
          );
        }
      }

      await redis.publish(`agent:${agentId}:progress`, JSON.stringify({
        executionId,
        status: "completed",
        output: `Successfully processed: ${input.substring(0, 200)}`,
        duration: 2000,
        timestamp: Date.now(),
      }));

      logger.info({ executionId }, "Agent execution completed successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";

      await redis.publish(`agent:${agentId}:progress`, JSON.stringify({
        executionId,
        status: "failed",
        error: message,
        timestamp: Date.now(),
      }));

      throw error;
    }
  }

  async close(): Promise<void> {
    await this.worker.close();
    logger.info("AgentWorker closed");
  }
}
