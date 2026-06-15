import { Queue, QueueEvents } from 'bullmq';
import { getRedis } from '../config/redis.js';
import { config } from '../config/index.js';

export const agentQueue = new Queue(config.agentQueueName, {
  connection: getRedis() as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { age: 3600 },
    removeOnFail: { age: 86400 },
  },
});

export const workflowQueue = new Queue(config.workflowQueueName, {
  connection: getRedis() as any,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 5000 },
    removeOnComplete: { age: 3600 },
    removeOnFail: { age: 86400 },
  },
});

export const agentQueueEvents = new QueueEvents(config.agentQueueName, {
  connection: getRedis() as any,
});

export const workflowQueueEvents = new QueueEvents(config.workflowQueueName, {
  connection: getRedis() as any,
});
