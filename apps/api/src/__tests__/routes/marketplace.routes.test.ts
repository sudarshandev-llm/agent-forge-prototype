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

const mockListing = {
  id: 'listing-1',
  name: 'Smart Agent',
  description: 'Description',
  shortDescription: 'Short',
  type: 'agent',
  status: 'published',
  category: 'chat',
  price: 0,
  tags: ['ai'],
  authorId: 'user-1',
  author: { id: 'user-1', name: 'Author', avatarUrl: null },
  version: '1.0.0',
  downloads: 10,
  rating: 4.5,
  reviewCount: 2,
  _count: { reviews: 2 },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

vi.mock('../../controllers/marketplace.controller.js', () => ({
  createListingHandler: vi.fn((_req: any, res: any) =>
    res.status(201).json({ success: true, data: mockListing }),
  ),
  getListingHandler: vi.fn((req: any, res: any) =>
    res.json({ success: true, data: { ...mockListing, id: req.params.id } }),
  ),
  listListingsHandler: vi.fn((_req: any, res: any) =>
    res.json({ success: true, data: [mockListing], meta: { page: 1, total: 1 } }),
  ),
  updateListingHandler: vi.fn((req: any, res: any) =>
    res.json({ success: true, data: { ...mockListing, ...req.body } }),
  ),
  deleteListingHandler: vi.fn((_req: any, res: any) => res.status(204).send()),
  publishListingHandler: vi.fn((_req: any, res: any) =>
    res.json({ success: true, data: { ...mockListing, status: 'published' } }),
  ),
  archiveListingHandler: vi.fn((_req: any, res: any) =>
    res.json({ success: true, data: { ...mockListing, status: 'archived' } }),
  ),
  createReviewHandler: vi.fn((_req: any, res: any) =>
    res.status(201).json({ success: true, data: { id: 'review-1', rating: 5 } }),
  ),
  getListingReviewsHandler: vi.fn((_req: any, res: any) => res.json({ success: true, data: [] })),
  getUserListingsHandler: vi.fn((_req: any, res: any) =>
    res.json({ success: true, data: [mockListing] }),
  ),
}));

describe('Marketplace Routes', () => {
  let app: express.Application;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    const marketplaceRoutes = (await import('../../routes/marketplace.routes.js')).default;
    app.use('/api/v1/marketplace', marketplaceRoutes);
  });

  it('GET /api/v1/marketplace should list listings (no auth)', async () => {
    const res = await makeRequest('GET', '/api/v1/marketplace');
    expect(res.status).toBe(200);
    expect(JSON.parse(res.body).success).toBe(true);
  });

  it('GET /api/v1/marketplace/:id should get listing (no auth)', async () => {
    const res = await makeRequest('GET', '/api/v1/marketplace/listing-1');
    expect(res.status).toBe(200);
  });

  it('GET /api/v1/marketplace/:id/reviews should get reviews (no auth)', async () => {
    const res = await makeRequest('GET', '/api/v1/marketplace/listing-1/reviews');
    expect(res.status).toBe(200);
  });

  it('POST /api/v1/marketplace should create listing (auth required)', async () => {
    const res = await makeRequest('POST', '/api/v1/marketplace', {
      name: 'New Listing',
      description: 'Desc',
      shortDescription: 'Short',
      type: 'agent',
      sourceId: 'src-1',
      sourceType: 'agent',
      category: 'chat',
    });
    expect(res.status).toBe(201);
  });

  it('PUT /api/v1/marketplace/:id should update listing', async () => {
    const res = await makeRequest('PUT', '/api/v1/marketplace/listing-1', { name: 'Updated' });
    expect(res.status).toBe(200);
    expect(JSON.parse(res.body).data.name).toBe('Updated');
  });

  it('DELETE /api/v1/marketplace/:id should delete listing', async () => {
    const res = await makeRequest('DELETE', '/api/v1/marketplace/listing-1');
    expect(res.status).toBe(204);
  });

  it('POST /api/v1/marketplace/:id/publish should publish listing', async () => {
    const res = await makeRequest('POST', '/api/v1/marketplace/listing-1/publish');
    expect(res.status).toBe(200);
  });

  it('POST /api/v1/marketplace/:id/archive should archive listing', async () => {
    const res = await makeRequest('POST', '/api/v1/marketplace/listing-1/archive');
    expect(res.status).toBe(200);
  });

  it('POST /api/v1/marketplace/:id/reviews should create review', async () => {
    const res = await makeRequest('POST', '/api/v1/marketplace/listing-1/reviews', {
      rating: 5,
      title: 'Great',
      content: 'Awesome',
    });
    expect(res.status).toBe(201);
  });

  it('GET /api/v1/marketplace/user/me should get user listings', async () => {
    const res = await makeRequest('GET', '/api/v1/marketplace/user/me');
    expect(res.status).toBe(200);
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
});
