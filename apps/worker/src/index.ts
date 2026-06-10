import { PrismaClient } from '@prisma/client';
import { config } from './config/index.js';
import { setupWorkers } from './config/queue.js';
import { logger } from './config/logger.js';

const prisma = new PrismaClient();

async function main() {
  logger.info('Worker service starting...');
  logger.info(`Environment: ${config.env}`);

  try {
    await prisma.$connect();
    logger.info('Database connected');
  } catch (error) {
    logger.error('Failed to connect to database', error);
    process.exit(1);
  }

  const { agentWorker, workflowWorker, emailWorker } = setupWorkers();

  logger.info('Workers registered:');
  logger.info('  - Agent execution worker');
  logger.info('  - Workflow execution worker');
  logger.info('  - Email worker');

  const gracefulShutdown = async (signal: string) => {
    logger.info(`${signal} received. Shutting down workers...`);

    await Promise.all([
      agentWorker.close(),
      workflowWorker.close(),
      emailWorker.close(),
    ]);

    await prisma.$disconnect();
    logger.info('Workers shut down gracefully');
    process.exit(0);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', error);
    process.exit(1);
  });
}

main();
