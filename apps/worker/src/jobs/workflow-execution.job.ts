import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger.js';

const prisma = new PrismaClient();

interface WorkflowExecutionPayload {
  workflowId: string;
  runId: string;
  userId: string;
  input: Record<string, unknown>;
}

export async function processWorkflowExecution(job: Job<WorkflowExecutionPayload>) {
  const { workflowId, runId, input } = job.data;

  logger.info(`Processing workflow execution ${runId} for workflow ${workflowId}`);

  try {
    await prisma.workflowRun.update({
      where: { id: runId },
      data: { status: 'running', startedAt: new Date() },
    });

    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: {
        nodes: { orderBy: { createdAt: 'asc' } },
        edges: true,
      },
    });

    if (!workflow) throw new Error(`Workflow ${workflowId} not found`);

    const startNode = workflow.nodes.find((n) => n.type === 'start');
    if (!startNode) throw new Error('No start node in workflow');

    let currentNodeId = startNode.id;
    const nodeResults: Record<string, unknown> = {};
    const visited = new Set<string>();

    while (currentNodeId && !visited.has(currentNodeId)) {
      visited.add(currentNodeId);
      const node = workflow.nodes.find((n) => n.id === currentNodeId);
      if (!node) break;

      const result = await executeNode(node, input, nodeResults);
      nodeResults[currentNodeId] = result;

      await prisma.workflowRun.update({
        where: { id: runId },
        data: { currentNodeId, nodeResults },
      });

      const edge = workflow.edges.find((e) => e.sourceNodeId === currentNodeId);
      currentNodeId = edge?.targetNodeId ?? '';
    }

    await prisma.workflowRun.update({
      where: { id: runId },
      data: {
        status: 'completed',
        output: nodeResults,
        completedAt: new Date(),
      },
    });

    logger.info(`Workflow run ${runId} completed`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    await prisma.workflowRun.update({
      where: { id: runId },
      data: {
        status: 'failed',
        error: message,
        completedAt: new Date(),
      },
    });

    logger.error(`Workflow run ${runId} failed: ${message}`);
    throw error;
  }
}

async function executeNode(
  node: { type: string; config: Record<string, unknown>; label: string },
  input: Record<string, unknown>,
  previousResults: Record<string, unknown>,
): Promise<unknown> {
  switch (node.type) {
    case 'start':
      return { status: 'started', input };
    case 'end':
      return { status: 'completed' };
    case 'delay': {
      const duration = (node.config.duration as number) || 1000;
      await new Promise((resolve) => setTimeout(resolve, duration));
      return { delayed: true, duration };
    }
    case 'condition': {
      const expression = node.config.expression as string;
      return { condition: expression, result: true };
    }
    case 'notification': {
      const channel = node.config.channel as string;
      const message = node.config.message as string;
      logger.info(`Notification via ${channel}: ${message}`);
      return { sent: true, channel };
    }
    default:
      return { type: node.type, status: 'executed', label: node.label };
  }
}
