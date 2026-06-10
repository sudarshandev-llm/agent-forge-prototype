import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const user = await prisma.user.upsert({
    where: { email: 'admin@agentforge.ai' },
    update: {},
    create: {
      email: 'admin@agentforge.ai',
      name: 'Admin User',
      roles: ['user', 'admin'],
    },
  });

  const personalTeam = await prisma.team.create({
    data: {
      name: "Admin's Team",
      description: 'Personal team',
      ownerId: user.id,
      isPersonal: true,
      members: {
        create: {
          userId: user.id,
          role: 'owner',
        },
      },
    },
  });

  const researchAgent = await prisma.agent.create({
    data: {
      name: 'Research Assistant',
      description: 'A general-purpose research agent that can search the web, analyze data, and summarize findings.',
      status: 'idle',
      capabilities: ['web_search', 'data_analysis', 'natural_language'],
      config: {
        model: 'gpt-4',
        provider: 'openai',
        temperature: 0.7,
        maxTokens: 2048,
        systemPrompt: 'You are a helpful research assistant. Help users find and analyze information.',
        memoryEnabled: true,
      },
      ownerId: user.id,
      teamId: personalTeam.id,
      isTemplate: true,
      isPublic: true,
      version: 1,
    },
  });

  const codeAgent = await prisma.agent.create({
    data: {
      name: 'Code Generator',
      description: 'Generates and reviews code across multiple programming languages.',
      status: 'idle',
      capabilities: ['code_generation', 'api_integration', 'natural_language'],
      config: {
        model: 'gpt-4',
        provider: 'openai',
        temperature: 0.3,
        maxTokens: 4096,
        systemPrompt: 'You are an expert software engineer. Generate clean, well-documented code.',
        memoryEnabled: true,
      },
      ownerId: user.id,
      teamId: personalTeam.id,
      isTemplate: true,
      isPublic: true,
      version: 1,
    },
  });

  const webSearchTool = await prisma.tool.create({
    data: {
      name: 'web_search',
      description: 'Search the web for information',
      type: 'web_search',
      category: 'search',
      ownerId: user.id,
      isBuiltin: true,
      isPublic: true,
      config: {
        type: 'web_search',
        timeout: 30000,
        maxRetries: 2,
        parameters: [
          { name: 'query', type: 'string', required: true, description: 'Search query' },
          { name: 'maxResults', type: 'number', required: false, description: 'Maximum results', defaultValue: 5 },
        ],
      },
    },
  });

  const httpRequestTool = await prisma.tool.create({
    data: {
      name: 'http_request',
      description: 'Make HTTP requests to external APIs',
      type: 'api_call',
      category: 'integration',
      ownerId: user.id,
      isBuiltin: true,
      isPublic: true,
      config: {
        type: 'api_call',
        timeout: 30000,
        maxRetries: 3,
        parameters: [
          { name: 'url', type: 'string', required: true, description: 'Request URL' },
          { name: 'method', type: 'string', required: false, description: 'HTTP method', defaultValue: 'GET' },
          { name: 'headers', type: 'object', required: false, description: 'Request headers' },
          { name: 'body', type: 'object', required: false, description: 'Request body' },
        ],
      },
    },
  });

  await prisma.agentTool.createMany({
    data: [
      { agentId: researchAgent.id, toolId: webSearchTool.id },
      { agentId: codeAgent.id, toolId: httpRequestTool.id },
    ],
  });

  const workflow = await prisma.workflow.create({
    data: {
      name: 'Research and Summarize',
      description: 'Searches the web for a topic and generates a summary',
      triggerType: 'manual',
      status: 'draft',
      ownerId: user.id,
      version: 1,
    },
  });

  await prisma.workflowNode.createMany({
    data: [
      {
        workflowId: workflow.id,
        type: 'start',
        label: 'Start',
        config: {},
        position: { x: 100, y: 100 },
        inputMapping: {},
        outputMapping: {},
      },
      {
        workflowId: workflow.id,
        type: 'agent_execution',
        label: 'Research Agent',
        config: { agentId: researchAgent.id },
        position: { x: 300, y: 100 },
        inputMapping: { query: '{{input.query}}' },
        outputMapping: { result: '{{output}}' },
      },
      {
        workflowId: workflow.id,
        type: 'end',
        label: 'End',
        config: {},
        position: { x: 500, y: 100 },
        inputMapping: {},
        outputMapping: {},
      },
    ],
  });

  await prisma.workflowEdge.createMany({
    data: [
      {
        workflowId: workflow.id,
        sourceNodeId: (await prisma.workflowNode.findFirst({ where: { workflowId, type: 'start' } }))!.id,
        targetNodeId: (await prisma.workflowNode.findFirst({ where: { workflowId, type: 'agent_execution' } }))!.id,
      },
      {
        workflowId: workflow.id,
        sourceNodeId: (await prisma.workflowNode.findFirst({ where: { workflowId, type: 'agent_execution' } }))!.id,
        targetNodeId: (await prisma.workflowNode.findFirst({ where: { workflowId, type: 'end' } }))!.id,
      },
    ],
  });

  const listing = await prisma.marketplaceListing.create({
    data: {
      name: 'Research Assistant Template',
      description: 'A powerful research agent template that can search the web, analyze data, and generate comprehensive summaries. Perfect for researchers, students, and professionals.',
      shortDescription: 'AI-powered research assistant for web search and analysis',
      type: 'agent',
      status: 'published',
      price: 0,
      authorId: user.id,
      sourceId: researchAgent.id,
      sourceType: 'agent',
      category: 'productivity',
      tags: ['research', 'analysis', 'web-search', 'template'],
      version: '1.0.0',
      publishedAt: new Date(),
    },
  });

  await prisma.marketplaceReview.create({
    data: {
      listingId: listing.id,
      userId: user.id,
      rating: 5,
      title: 'Excellent template',
      content: 'This agent template is incredibly useful for research tasks. Highly recommend!',
      pros: ['Easy to use', 'Great documentation', 'Highly customizable'],
      cons: [],
    },
  });

  await prisma.execution.create({
    data: {
      type: 'agent',
      status: 'completed',
      trigger: 'manual',
      input: { query: 'What is the latest in AI research?' },
      output: { content: 'Based on recent research, AI continues to advance rapidly...' },
      duration: 3450,
      tokenUsage: { promptTokens: 150, completionTokens: 450, totalTokens: 600 },
      cost: 0.003,
      ownerId: user.id,
      agentId: researchAgent.id,
    },
  });

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
