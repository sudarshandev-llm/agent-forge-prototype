import { Worker } from 'bullmq';
import { config } from './index.js';
import { redis } from './redis.js';
import { processAgentExecution } from '../jobs/agent-execution.job.js';
import { processWorkflowExecution } from '../jobs/workflow-execution.job.js';
import { processEmail } from '../jobs/email.job.js';
import { logger } from './logger.js';

const connection = redis;

export function setupWorkers() {
  const agentWorker = new Worker('agent-execution', processAgentExecution, {
    connection,
    concurrency: 5,
    lockDuration: 60000,
    maxStalledCount: 3,
  });

  const workflowWorker = new Worker('workflow-execution', processWorkflowExecution, {
    connection,
    concurrency: 3,
    lockDuration: 120000,
    maxStalledCount: 2,
  });

  const emailWorker = new Worker('email', processEmail, {
    connection,
    concurrency: 10,
    lockDuration: 30000,
  });

  agentWorker.on('completed', (job) => {
    logger.info(`Agent execution job ${job.id} completed`);
  });

  agentWorker.on('failed', (job, err) => {
    logger.error(`Agent execution job ${job?.id} failed: ${err.message}`);
  });

  workflowWorker.on('completed', (job) => {
    logger.info(`Workflow job ${job.id} completed`);
  });

  workflowWorker.on('failed', (job, err) => {
    logger.error(`Workflow job ${job?.id} failed: ${err.message}`);
  });

  emailWorker.on('completed', (job) => {
    logger.info(`Email job ${job.id} completed`);
  });

  emailWorker.on('failed', (job, err) => {
    logger.error(`Email job ${job?.id} failed: ${err.message}`);
  });

  return { agentWorker, workflowWorker, emailWorker };
}
