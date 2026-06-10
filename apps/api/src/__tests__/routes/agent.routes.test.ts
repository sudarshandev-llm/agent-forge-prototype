import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import { authenticate } from '../../middleware/auth.js';

vi.mock('../../middleware/auth.js', () => ({
  authenticate: vi.fn((_req: any, _res: any, next: any) => {
    _req.user = { userId: 'user-1', email: 'test@test.com', roles: ['user'] };
    next();
  }),
  optionalAuth: vi.fn((_req: any, _res: any, next: any) => next()),
  requireRole: vi.fn(() => (_req: any, _res: any, next: any) => next()),
  requireApiKey: vi.fn((_req: any, _res: any, next: any) => next()),
}));

vi.mock('../../middleware/rateLimiter.js', () => ({
  apiLimiter: vi.fn((_req: any, _res: any, next: any) => next()),
  executionLimiter: vi.fn((_req: any, _res: any, next: any) => next()),
}));

const mockAgent = {
  id: 'agent-1',
  name: 'Test Agent',
  description: 'A test agent',
  capabilities: ['code_generation'],
  config: { model: 'gpt-4' },
  ownerId: 'user-1',
  status: 'idle',
  version: 1,
  tools: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

vi.mock('../../controllers/agent.controller.js', () => ({
  createAgentHandler: vi.fn((_req: any, res: any) => {
    res.status(201).json({ success: true, data: mockAgent });
  }),
  getAgentHandler: vi.fn((req: any, res: any) => {
    res.json({ success: true, data: { ...mockAgent, id: req.params.id } });
  }),
  listAgentsHandler: vi.fn((_req: any, res: any) => {
    res.json({ success: true, data: [mockAgent], meta: { page: 1, total: 1 } });
  }),
  updateAgentHandler: vi.fn((req: any, res: any) => {
    res.json({ success: true, data: { ...mockAgent, ...req.body } });
  }),
  deleteAgentHandler: vi.fn((_req: any, res: any) => {
    res.status(204).send();
  }),
  executeAgentHandler: vi.fn((_req: any, res: any) => {
    res.json({ success: true, data: { executionId: 'exec-1', status: 'pending' } });
  }),
  getAgentExecutionsHandler: vi.fn((_req: any, res: any) => {
    res.json({ success: true, data: [] });
  }),
  forkAgentHandler: vi.fn((req: any, res: any) => {
    res.status(201).json({ success: true, data: { ...mockAgent, id: 'forked-1', name: 'Forked Agent' } });
  }),
}));

describe('Agent Routes', () => {
  let app: express.Application;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    const agentRoutes = (await import('../../routes/agent.routes.js')).default;
    app.use('/api/v1/agents', agentRoutes);
  });

  it('GET /api/v1/agents should list agents', async () => {
    const res = await makeRequest('GET', '/api/v1/agents');
    expect(res.status).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
  });

  it('POST /api/v1/agents should create agent', async () => {
    const res = await makeRequest('POST', '/api/v1/agents', { name: 'New Agent', description: 'desc', capabilities: [], config: {} });
    expect(res.status).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
  });

  it('GET /api/v1/agents/:id should get agent by id', async () => {
    const res = await makeRequest('GET', '/api/v1/agents/agent-1');
    expect(res.status).toBe(200);
  });

  it('PUT /api/v1/agents/:id should update agent', async () => {
    const res = await makeRequest('PUT', '/api/v1/agents/agent-1', { name: 'Updated' });
    expect(res.status).toBe(200);
  });

  it('DELETE /api/v1/agents/:id should delete agent', async () => {
    const res = await makeRequest('DELETE', '/api/v1/agents/agent-1');
    expect(res.status).toBe(204);
  });

  it('POST /api/v1/agents/:id/execute should execute agent', async () => {
    const res = await makeRequest('POST', '/api/v1/agents/agent-1/execute', { input: { prompt: 'Hi' } });
    expect(res.status).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.executionId).toBe('exec-1');
  });

  it('POST /api/v1/agents/:id/fork should fork agent', async () => {
    const res = await makeRequest('POST', '/api/v1/agents/agent-1/fork');
    expect(res.status).toBe(201);
  });

  it('GET /api/v1/agents/:id/executions should list agent executions', async () => {
    const res = await makeRequest('GET', '/api/v1/agents/agent-1/executions');
    expect(res.status).toBe(200);
  });

  it('should apply authentication middleware to all routes', async () => {
    await makeRequest('GET', '/api/v1/agents');
    expect(authenticate).toHaveBeenCalled();
  });
});

async function makeRequest(method: string, path: string, body?: any): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = (express.request as any) || require('http').request;
    const appInstance = (app as any);
    const server = appInstance.listen(0, () => {
      const { AddressInfo } = require('net');
      const port = server.address().port;
      const http = require('http');

      const options = { hostname: 'localhost', port, path, method, headers: { 'Content-Type': 'application/json' } };
      const clientReq = http.request(options, (res: any) => {
        let data = '';
        res.on('data', (chunk: string) => { data += chunk; });
        res.on('end', () => {
          server.close();
          resolve({ status: res.statusCode || 200, body: data });
        });
      });
      clientReq.on('error', (err: Error) => { server.close(); reject(err); });
      if (body) clientReq.write(JSON.stringify(body));
      clientReq.end();
    });
  });
}
