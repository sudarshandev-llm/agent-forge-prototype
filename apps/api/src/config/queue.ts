import { Queue, QueueEvents, Worker } from 'bullmq';
import { config } from './index.js';
import { redis } from './redis.js';
import { logger } from '../utils/logger.js';

const connection = redis;

export const executionQueue = new Queue('agent-execution', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { age: 3600 * 24 * 7 },
    removeOnFail: { age: 3600 * 24 * 30 },
  },
});

export const workflowQueue = new Queue('workflow-execution', {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 5000 },
    removeOnComplete: { age: 3600 * 24 * 7 },
    removeOnFail: { age: 3600 * 24 * 30 },
  },
});

export const emailQueue = new Queue('email', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { age: 3600 * 24 },
    removeOnFail: { age: 3600 * 24 * 7 },
  },
});

const executionEvents = new QueueEvents('agent-execution', { connection });
const workflowEvents = new QueueEvents('workflow-execution', { connection });

executionEvents.on('completed', ({ jobId }) => {
  logger.info(`Execution job ${jobId} completed`);
});

executionEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error(`Execution job ${jobId} failed: ${failedReason}`);
});

workflowEvents.on('completed', ({ jobId }) => {
  logger.info(`Workflow job ${jobId} completed`);
});

workflowEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error(`Workflow job ${jobId} failed: ${failedReason}`);
});

export async function getQueueMetrics() {
  const [executionCounts, workflowCounts, emailCounts] = await Promise.all([
    executionQueue.getJobCounts(),
    workflowQueue.getJobCounts(),
    emailQueue.getJobCounts(),
  ]);

  return {
    execution: executionCounts,
    workflow: workflowCounts,
    email: emailCounts,
  };
}

export { executionEvents, workflowEvents };
