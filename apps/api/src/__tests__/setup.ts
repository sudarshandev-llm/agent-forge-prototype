import { vi } from 'vitest';

vi.mock('../config/database.js', () => ({
  prisma: {
    agent: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      delete: vi.fn(),
    },
    agentVersion: { create: vi.fn() },
    agentMemory: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    execution: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    executionLog: { create: vi.fn(), findMany: vi.fn() },
    team: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    teamMember: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
    tool: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    marketplaceListing: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    marketplaceReview: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    user: { findUnique: vi.fn() },
    $transaction: vi.fn((fn: (tx: any) => any) => fn({})),
  },
}));

vi.mock('../config/queue.js', () => ({
  executionQueue: { add: vi.fn() },
  workflowQueue: { add: vi.fn() },
  emailQueue: { add: vi.fn() },
}));

vi.mock('../config/redis.js', () => ({
  redis: { ping: vi.fn().mockResolvedValue('PONG') },
}));

vi.mock('../services/websocket.service.js', () => ({
  websocketService: {
    sendToUser: vi.fn(),
    sendToTeam: vi.fn(),
    broadcast: vi.fn(),
  },
}));

vi.mock('../services/llm.service.js', () => ({
  llmService: {
    complete: vi.fn(),
    embed: vi.fn(),
  },
}));
