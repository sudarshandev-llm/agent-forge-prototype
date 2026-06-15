import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';

vi.mock('../../middleware/auth.js', () => ({
  authenticate: vi.fn((_req: any, _res: any, next: any) => {
    _req.user = { userId: 'user-1', email: 'test@test.com', roles: ['user'] };
    next();
  }),
  optionalAuth: vi.fn((_req: any, _res: any, next: any) => next()),
  requireRole: vi.fn(() => (_req: any, _res: any, next: any) => next()),
}));

const mockTeam = {
  id: 'team-1',
  name: 'My Team',
  description: 'A team',
  ownerId: 'user-1',
  members: [{ userId: 'user-1', role: 'owner' }],
  _count: { agents: 0 },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

vi.mock('../../controllers/team.controller.js', () => ({
  createTeamHandler: vi.fn((_req: any, res: any) =>
    res.status(201).json({ success: true, data: mockTeam }),
  ),
  getTeamHandler: vi.fn((req: any, res: any) =>
    res.json({ success: true, data: { ...mockTeam, id: req.params.id } }),
  ),
  listTeamsHandler: vi.fn((_req: any, res: any) => res.json({ success: true, data: [mockTeam] })),
  updateTeamHandler: vi.fn((req: any, res: any) =>
    res.json({ success: true, data: { ...mockTeam, ...req.body } }),
  ),
  deleteTeamHandler: vi.fn((_req: any, res: any) => res.status(204).send()),
  addMemberHandler: vi.fn((_req: any, res: any) =>
    res.status(201).json({ success: true, data: { userId: 'user-2', role: 'member' } }),
  ),
  removeMemberHandler: vi.fn((_req: any, res: any) => res.status(204).send()),
  updateMemberRoleHandler: vi.fn((req: any, res: any) =>
    res.json({ success: true, data: { userId: req.params.userId, role: req.body.role } }),
  ),
  getTeamAgentsHandler: vi.fn((_req: any, res: any) => res.json({ success: true, data: [] })),
}));

describe('Team Routes', () => {
  let app: express.Application;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    const teamRoutes = (await import('../../routes/team.routes.js')).default;
    app.use('/api/v1/teams', teamRoutes);
  });

  it('GET /api/v1/teams should list teams', async () => {
    const res = await makeRequest('GET', '/api/v1/teams');
    expect(res.status).toBe(200);
    expect(JSON.parse(res.body).success).toBe(true);
  });

  it('POST /api/v1/teams should create team', async () => {
    const res = await makeRequest('POST', '/api/v1/teams', { name: 'New Team' });
    expect(res.status).toBe(201);
  });

  it('GET /api/v1/teams/:id should get team', async () => {
    const res = await makeRequest('GET', '/api/v1/teams/team-1');
    expect(res.status).toBe(200);
  });

  it('PUT /api/v1/teams/:id should update team', async () => {
    const res = await makeRequest('PUT', '/api/v1/teams/team-1', { name: 'Updated' });
    expect(res.status).toBe(200);
  });

  it('DELETE /api/v1/teams/:id should delete team', async () => {
    const res = await makeRequest('DELETE', '/api/v1/teams/team-1');
    expect(res.status).toBe(204);
  });

  it('POST /api/v1/teams/:id/members should add member', async () => {
    const res = await makeRequest('POST', '/api/v1/teams/team-1/members', {
      userId: 'user-2',
      role: 'member',
    });
    expect(res.status).toBe(201);
  });

  it('DELETE /api/v1/teams/:id/members/:userId should remove member', async () => {
    const res = await makeRequest('DELETE', '/api/v1/teams/team-1/members/user-2');
    expect(res.status).toBe(204);
  });

  it('PUT /api/v1/teams/:id/members/:userId should update role', async () => {
    const res = await makeRequest('PUT', '/api/v1/teams/team-1/members/user-2', { role: 'admin' });
    expect(res.status).toBe(200);
    expect(JSON.parse(res.body).data.role).toBe('admin');
  });

  it('GET /api/v1/teams/:id/agents should list team agents', async () => {
    const res = await makeRequest('GET', '/api/v1/teams/team-1/agents');
    expect(res.status).toBe(200);
  });
});

async function makeRequest(
  method: string,
  path: string,
  body?: any,
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const server = (app as any).listen(0, () => {
      const port = server.address().port;
      const http = require('http');
      const options = {
        hostname: 'localhost',
        port,
        path,
        method,
        headers: { 'Content-Type': 'application/json' },
      };
      const clientReq = http.request(options, (res: any) => {
        let data = '';
        res.on('data', (chunk: string) => {
          data += chunk;
        });
        res.on('end', () => {
          server.close();
          resolve({ status: res.statusCode || 200, body: data });
        });
      });
      clientReq.on('error', (err: Error) => {
        server.close();
        reject(err);
      });
      if (body) clientReq.write(JSON.stringify(body));
      clientReq.end();
    });
  });
}
