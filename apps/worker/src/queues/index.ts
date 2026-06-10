import { Queue, QueueEvents } from "bullmq";
import { getRedis } from "../config/redis.js";
import { config } from "../config/index.js";

export const agentQueue = new Queue(config.agentQueueName, {
  connection: getRedis(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: { age: 3600 },
    removeOnFail: { age: 86400 },
  },
});

export const workflowQueue = new Queue(config.workflowQueueName, {
  connection: getRedis(),
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "fixed", delay: 5000 },
    removeOnComplete: { age: 3600 },
    removeOnFail: { age: 86400 },
  },
});

export const agentQueueEvents = new QueueEvents(config.agentQueueName, {
  connection: getRedis(),
});

export const workflowQueueEvents = new QueueEvents(config.workflowQueueName, {
  connection: getRedis(),
});
