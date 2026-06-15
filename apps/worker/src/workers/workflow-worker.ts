import { Worker, Job } from "bullmq";
import { getRedis } from "../config/redis.js";
import { config } from "../config/index.js";
import { logger } from "../config/logger.js";

export type NodeType = "agent" | "condition" | "tool" | "trigger" | "end";

export interface WorkflowNode {
  id: string;
  type: NodeType;
  label: string;
  config: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

export interface WorkflowJobData {
  executionId: string;
  workflowId: string;
  userId: string;
  triggerData: Record<string, unknown>;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface NodeResult {
  nodeId: string;
  nodeType: NodeType;
  status: "success" | "failed" | "skipped";
  output: unknown;
  error?: string;
  duration: number;
  timestamp: number;
}

export class WorkflowWorker {
  private worker: Worker;

  constructor() {
    this.worker = new Worker<WorkflowJobData>(
      config.workflowQueueName,
      async (job: Job<WorkflowJobData>) => this.process(job),
      {
        connection: getRedis() as any,
        concurrency: 3,
        limiter: { max: 5, duration: 1000 },
      },
    );

    this.worker.on("completed", (job) => {
      logger.info(
        {
          jobId: job.id,
          workflowId: job.data.workflowId,
          executionId: job.data.executionId,
        },
        "Workflow execution completed",
      );
    });

    this.worker.on("failed", (job, error) => {
      logger.error(
        {
          jobId: job?.id,
          error: error.message,
          executionId: job?.data.executionId,
        },
        "Workflow execution failed",
      );
    });

    logger.info("WorkflowWorker initialized");
  }

  private async process(job: Job<WorkflowJobData>): Promise<{ results: NodeResult[]; success: boolean }> {
    const { executionId, workflowId, userId, triggerData, nodes, edges } = job.data;

    logger.info({ executionId, workflowId }, "Processing workflow execution");

    const redis = getRedis();
    const results: NodeResult[] = [];

    await redis.publish(`workflow:${workflowId}:progress`, JSON.stringify({
      executionId,
      status: "running",
      workflowId,
      timestamp: Date.now(),
    }));

    try {
      const nodeMap = new Map<string, WorkflowNode>();
      for (const node of nodes) {
        nodeMap.set(node.id, node);
      }

      const adjacency = new Map<string, string[]>();
      const inDegree = new Map<string, number>();
      for (const node of nodes) {
        adjacency.set(node.id, []);
        inDegree.set(node.id, 0);
      }
      for (const edge of edges) {
        adjacency.get(edge.source)?.push(edge.target);
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
      }

      const startNodes = nodes.filter((n) => (inDegree.get(n.id) || 0) === 0);
      const queue: string[] = startNodes.map((n) => n.id);
      const context: Record<string, unknown> = { triggerData };

      while (queue.length > 0) {
        const nodeId = queue.shift()!;
        const node = nodeMap.get(nodeId);
        if (!node) continue;

        const result = await this.executeNode(node, context, redis, executionId, workflowId);
        results.push(result);

        if (result.status === "success") {
          context[`${node.id}_output`] = result.output;

          const targets = adjacency.get(nodeId) || [];
          for (const target of targets) {
            const edge = edges.find((e) => e.source === nodeId && e.target === target);
            if (edge?.condition) {
              const shouldExecute = this.evaluateCondition(edge.condition, context);
              if (!shouldExecute) {
                const targetNode = nodeMap.get(target);
                if (targetNode) {
                  results.push({
                    nodeId: target,
                    nodeType: targetNode.type,
                    status: "skipped",
                    output: null,
                    duration: 0,
                    timestamp: Date.now(),
                  });
                }
                continue;
              }
            }
            queue.push(target);
          }
        }

        await job.updateProgress(Math.round((results.length / nodes.length) * 100));
      }

      const overallSuccess = results.every((r) => r.status !== "failed");

      await redis.publish(`workflow:${workflowId}:progress`, JSON.stringify({
        executionId,
        workflowId,
        status: overallSuccess ? "completed" : "failed",
        results,
        duration: results.reduce((sum, r) => sum + r.duration, 0),
        timestamp: Date.now(),
      }));

      logger.info(
        { executionId, workflowId, nodeCount: results.length },
        "Workflow execution completed",
      );

      return { results, success: overallSuccess };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";

      await redis.publish(`workflow:${workflowId}:progress`, JSON.stringify({
        executionId,
        workflowId,
        status: "failed",
        error: message,
        results,
        timestamp: Date.now(),
      }));

      throw error;
    }
  }

  private async executeNode(
    node: WorkflowNode,
    context: Record<string, unknown>,
    redis: import("ioredis").Redis,
    executionId: string,
    workflowId: string,
  ): Promise<NodeResult> {
    const startTime = Date.now();
    const startMark = performance.now();

    await redis.publish(`workflow:${workflowId}:progress`, JSON.stringify({
      executionId,
      workflowId,
      status: "running",
      currentNode: { id: node.id, type: node.type, label: node.label },
      timestamp: Date.now(),
    }));

    try {
      let output: unknown;

      switch (node.type) {
        case "agent": {
          const prompt = typeof node.config.prompt === "string"
            ? this.interpolateTemplate(node.config.prompt, context)
            : "Execute agent action";
          output = await this.executeAgentAction(prompt, node.config);
          break;
        }
        case "tool": {
          output = await this.executeToolCall(node.config, context);
          break;
        }
        case "condition": {
          output = this.evaluateCondition(
            node.config.expression as string,
            context,
          );
          break;
        }
        case "trigger": {
          output = context.triggerData;
          break;
        }
        case "end": {
          output = { completed: true };
          break;
        }
        default: {
          output = null;
        }
      }

      const duration = Math.round(performance.now() - startMark);

      return {
        nodeId: node.id,
        nodeType: node.type,
        status: "success",
        output,
        duration,
        timestamp: Date.now(),
      };
    } catch (error) {
      const duration = Math.round(performance.now() - startMark);
      const message = error instanceof Error ? error.message : "Node execution failed";

      return {
        nodeId: node.id,
        nodeType: node.type,
        status: "failed",
        output: null,
        error: message,
        duration,
        timestamp: Date.now(),
      };
    }
  }

  private interpolateTemplate(template: string, context: Record<string, unknown>): string {
    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, key) => {
      const keys = key.split(".");
      let value: unknown = context;
      for (const k of keys) {
        if (value && typeof value === "object" && k in value) {
          value = (value as Record<string, unknown>)[k];
        } else {
          return `{{${key}}}`;
        }
      }
      return value != null ? String(value) : `{{${key}}}`;
    });
  }

  private evaluateCondition(expression: string, context: Record<string, unknown>): boolean {
    const normalized = expression.trim();

    try {
      const dataKeys = normalized.match(/\b[a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*)*\b/g) || [];
      const vals: Record<string, unknown> = {};
      for (const key of dataKeys) {
        if (!["true", "false", "null", "undefined"].includes(key) && !/^\d+$/.test(key)) {
          const keys = key.split(".");
          let value: unknown = context;
          for (const k of keys) {
            if (value && typeof value === "object" && k in value) {
              value = (value as Record<string, unknown>)[k];
            } else {
              value = undefined;
              break;
            }
          }
          vals[key] = value;
        }
      }

      const evalStr = normalized.replace(/\b[a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*)*\b/g, (match) => {
        if (["true", "false", "null", "undefined"].includes(match) || /^\d+$/.test(match)) {
          return match;
        }
        return JSON.stringify(vals[match]);
      });

      return Function(`"use strict"; return (${evalStr})`)();
    } catch {
      logger.warn({ expression }, "Failed to evaluate condition, defaulting to true");
      return true;
    }
  }

  private async executeAgentAction(
    _prompt: string,
    _config: Record<string, unknown>,
  ): Promise<unknown> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { result: `Executed agent action with prompt: "${_prompt.substring(0, 50)}..."` };
  }

  private async executeToolCall(
    _config: Record<string, unknown>,
    _context: Record<string, unknown>,
  ): Promise<unknown> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return { toolResult: `Tool ${String(_config.toolId || "unknown")} executed` };
  }

  async close(): Promise<void> {
    await this.worker.close();
    logger.info("WorkflowWorker closed");
  }
}
