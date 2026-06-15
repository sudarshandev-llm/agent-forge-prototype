import dotenv from 'dotenv';
dotenv.config();

import { closeRedis, getRedis } from './config/redis.js';
import { config } from './config/index.js';
import { logger } from './config/logger.js';
import { AgentWorker } from './workers/agent-worker.js';
import { WorkflowWorker } from './workers/workflow-worker.js';

async function main() {
  logger.info(
    { env: config.env, agentQueue: config.agentQueueName, workflowQueue: config.workflowQueueName },
    'Worker service starting',
  );

  const redis = getRedis();

  try {
    await redis.ping();
    logger.info('Redis connection established');
  } catch (error) {
    logger.error({ err: error }, 'Failed to connect to Redis');
    process.exit(1);
  }

  const agentWorker = new AgentWorker();
  const workflowWorker = new WorkflowWorker();

  logger.info('All workers registered and ready');

  const gracefulShutdown = async (signal: string) => {
    logger.info(`${signal} received. Shutting down workers...`);

    await Promise.all([agentWorker.close(), workflowWorker.close()]);

    await closeRedis();
    logger.info('Graceful shutdown complete');
    process.exit(0);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('uncaughtException', (error) => {
    logger.error({ err: error }, 'Uncaught exception');
    process.exit(1);
  });
}

main();
