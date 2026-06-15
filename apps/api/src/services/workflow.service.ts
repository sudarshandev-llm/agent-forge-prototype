import { prisma } from '../config/database.js';
import { workflowQueue } from '../config/queue.js';
import { ApiError } from '../middleware/errorHandler.js';
import { WorkflowStatus, ExecutionStatus } from '@agentforge/shared';

export const workflowService = {
  async createWorkflow(data: {
    name: string;
    description?: string;
    triggerType: string;
    triggerConfig?: Record<string, unknown>;
    nodes?: Array<{
      type: string;
      label: string;
      config: Record<string, unknown>;
      position: { x: number; y: number };
    }>;
    edges?: Array<{
      sourceNodeId: string;
      targetNodeId: string;
      condition?: string;
    }>;
    ownerId: string;
  }) {
    const workflow = await prisma.workflow.create({
      data: {
        name: data.name,
        description: data.description || '',
        triggerType: data.triggerType,
        triggerConfig: (data.triggerConfig ?? {}) as any,
        ownerId: data.ownerId,
        status: WorkflowStatus.DRAFT,
        version: 1,
      },
    });

    if (data.nodes) {
      for (let i = 0; i < data.nodes.length; i++) {
        const node = data.nodes[i]!;
        await prisma.workflowNode.create({
          data: {
            workflowId: workflow.id,
            type: node.type,
            label: node.label,
            config: node.config as any,
            position: node.position as any,
            inputMapping: {} as any,
            outputMapping: {} as any,
          },
        });
      }
    }

    if (data.edges) {
      for (const edge of data.edges) {
        await prisma.workflowEdge.create({
          data: {
            workflowId: workflow.id,
            sourceNodeId: edge.sourceNodeId,
            targetNodeId: edge.targetNodeId,
            condition: edge.condition ?? null,
          },
        });
      }
    }

    return this.getWorkflowById(workflow.id, data.ownerId);
  },

  async getWorkflowById(id: string, userId: string) {
    const workflow = await prisma.workflow.findFirst({
      where: {
        id,
        OR: [{ ownerId: userId }, { team: { members: { some: { userId } } } }],
        deletedAt: null,
      },
      include: {
        nodes: { orderBy: { createdAt: 'asc' } },
        edges: true,
      },
    });

    if (!workflow) {
      throw new ApiError(404, 'Workflow not found');
    }

    return workflow;
  },

  async listWorkflows(userId: string) {
    return prisma.workflow.findMany({
      where: {
        OR: [{ ownerId: userId }, { team: { members: { some: { userId } } } }],
        deletedAt: null,
      },
      include: {
        _count: { select: { nodes: true, edges: true, runs: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  },

  async updateWorkflow(id: string, userId: string, data: Record<string, unknown>) {
    const workflow = await this.getWorkflowById(id, userId);

    if (workflow.ownerId !== userId) {
      throw new ApiError(403, 'Not authorized to update this workflow');
    }

    return prisma.workflow.update({
      where: { id },
      data: {
        ...data,
        version: workflow.version + 1,
      },
      include: { nodes: true, edges: true },
    });
  },

  async deleteWorkflow(id: string, userId: string) {
    const workflow = await this.getWorkflowById(id, userId);

    if (workflow.ownerId !== userId) {
      throw new ApiError(403, 'Not authorized to delete this workflow');
    }

    await prisma.workflow.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },

  async activateWorkflow(id: string, userId: string) {
    const workflow = await this.getWorkflowById(id, userId);

    if (workflow.nodes.length === 0) {
      throw new ApiError(400, 'Cannot activate workflow with no nodes');
    }

    return prisma.workflow.update({
      where: { id },
      data: { status: WorkflowStatus.ACTIVE },
    });
  },

  async pauseWorkflow(id: string, userId: string) {
    const workflow = await this.getWorkflowById(id, userId);

    return prisma.workflow.update({
      where: { id },
      data: { status: WorkflowStatus.PAUSED },
    });
  },

  async runWorkflow(id: string, userId: string, input: Record<string, unknown>) {
    const workflow = await this.getWorkflowById(id, userId);

    const run = await prisma.workflowRun.create({
      data: {
        workflowId: id,
        status: ExecutionStatus.PENDING,
        trigger: 'manual',
        input: input as any,
        nodeResults: {} as any,
      },
    });

    await workflowQueue.add('workflow-execution', {
      workflowId: id,
      runId: run.id,
      userId,
      input,
    });

    return run;
  },

  async processWorkflow(jobData: {
    workflowId: string;
    runId: string;
    userId: string;
    input: Record<string, unknown>;
  }) {
    const { workflowId, runId, input } = jobData;

    await prisma.workflowRun.update({
      where: { id: runId },
      data: { status: ExecutionStatus.RUNNING, startedAt: new Date() },
    });

    try {
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
        include: {
          nodes: { orderBy: { createdAt: 'asc' } },
          edges: true,
        },
      });

      if (!workflow) throw new Error('Workflow not found');

      const startNode = workflow.nodes.find((n: (typeof workflow.nodes)[0]) => n.type === 'start');
      if (!startNode) throw new Error('No start node found');

      let currentNodeId = startNode.id;
      const nodeResults: Record<string, unknown> = {};
      const visited = new Set<string>();

      while (currentNodeId && !visited.has(currentNodeId)) {
        visited.add(currentNodeId);
        const node = workflow.nodes.find((n: (typeof workflow.nodes)[0]) => n.id === currentNodeId);
        if (!node) break;

        const result = await this.executeNode(node, input, nodeResults);
        nodeResults[currentNodeId] = result;

        await prisma.workflowRun.update({
          where: { id: runId },
          data: { currentNodeId, nodeResults } as any,
        });

        const outgoingEdge = workflow.edges.find(
          (e: (typeof workflow.edges)[0]) => e.sourceNodeId === currentNodeId,
        );
        currentNodeId = outgoingEdge?.targetNodeId ?? '';
      }

      await prisma.workflowRun.update({
        where: { id: runId },
        data: {
          status: ExecutionStatus.COMPLETED,
          output: nodeResults as any,
          completedAt: new Date(),
        },
      });
    } catch (error) {
      await prisma.workflowRun.update({
        where: { id: runId },
        data: {
          status: ExecutionStatus.FAILED,
          error: error instanceof Error ? error.message : 'Workflow execution failed',
          completedAt: new Date(),
        },
      });
    }
  },

  async executeNode(
    node: Record<string, unknown>,
    input: Record<string, unknown>,
    previousResults: Record<string, unknown>,
  ): Promise<unknown> {
    const nodeType = node.type as string;
    const config = node.config as Record<string, unknown>;

    switch (nodeType) {
      case 'start':
        return { input, status: 'started' };
      case 'end':
        return { status: 'completed' };
      case 'delay':
        await new Promise((resolve) => setTimeout(resolve, (config.duration as number) || 1000));
        return { delayed: true };
      case 'condition': {
        const condition = config.expression as string;
        return { condition, result: true };
      }
      default:
        return { nodeType, status: 'executed' };
    }
  },

  async getWorkflowRuns(workflowId: string, userId: string) {
    await this.getWorkflowById(workflowId, userId);

    return prisma.workflowRun.findMany({
      where: { workflowId },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });
  },
};
