import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger.js';
import { llmProcessor } from '../processors/llm.processor.js';
import { toolProcessor } from '../processors/tool.processor.js';

const prisma = new PrismaClient();

interface AgentExecutionPayload {
  executionId: string;
  agentId: string;
  userId: string;
  input: Record<string, unknown>;
}

export async function processAgentExecution(job: Job<AgentExecutionPayload>) {
  const { executionId, agentId, input } = job.data;

  logger.info(`Processing agent execution ${executionId} for agent ${agentId}`);

  try {
    await prisma.execution.update({
      where: { id: executionId },
      data: { status: 'running' },
    });

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: { tools: { include: { tool: true } } },
    });

    if (!agent) throw new Error(`Agent ${agentId} not found`);

    const config = agent.config as {
      model: string;
      provider: string;
      temperature: number;
      maxTokens: number;
      systemPrompt: string;
    };

    const messages = [
      { role: 'system', content: config.systemPrompt || 'You are a helpful AI assistant.' },
      { role: 'user', content: JSON.stringify(input) },
    ];

    const llmResponse = await llmProcessor.complete({
      provider: config.provider || 'openai',
      model: config.model || 'gpt-4',
      messages,
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 2048,
    });

    let toolResults: unknown[] = [];
    const toolCalls = extractToolCalls(llmResponse.content);

    if (toolCalls.length > 0) {
      toolResults = await Promise.all(
        toolCalls.map((call) =>
          toolProcessor.executeTool(call.name, call.parameters).catch((err) => ({
            name: call.name,
            error: err.message,
          })),
        ),
      );
    }

    await prisma.execution.update({
      where: { id: executionId },
      data: {
        status: 'completed',
        output: { content: llmResponse.content, toolResults } as any,
        duration: Date.now() - new Date(job.timestamp).getTime(),
        tokenUsage: llmResponse.usage,
        completedAt: new Date(),
      },
    });

    logger.info(`Agent execution ${executionId} completed successfully`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    await prisma.execution.update({
      where: { id: executionId },
      data: {
        status: 'failed',
        error: message,
        completedAt: new Date(),
      },
    });

    logger.error(`Agent execution ${executionId} failed: ${message}`);
    throw error;
  }
}

function extractToolCalls(
  content: string,
): Array<{ name: string; parameters: Record<string, unknown> }> {
  const calls: Array<{ name: string; parameters: Record<string, unknown> }> = [];
  const regex = /<tool_call>\s*(\{[\s\S]*?\})\s*<\/tool_call>/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    try {
      calls.push(JSON.parse(match[1]!) as { name: string; parameters: Record<string, unknown> });
    } catch {
      // skip invalid
    }
  }

  return calls;
}
