import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';

function mockReq(body: any = {}, query: any = {}, params: any = {}) {
  return { body, query, params } as any;
}

function mockRes() {
  const res: any = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
}

const testSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.number().min(0, 'Age must be positive'),
});

describe('validate middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should pass valid body through schema', () => {
    const req = mockReq({ name: 'Test', age: 25 });
    const res = mockRes();
    const next = vi.fn();
    const middleware = validate(testSchema);

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.body).toEqual({ name: 'Test', age: 25 });
  });

  it('should reject invalid body', () => {
    const req = mockReq({ name: '', age: -1 });
    const res = mockRes();
    const next = vi.fn();
    const middleware = validate(testSchema);

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
        }),
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should validate query parameters', () => {
    const querySchema = z.object({ page: z.coerce.number().int().positive() });
    const req = mockReq({}, { page: '2' });
    const res = mockRes();
    const next = vi.fn();
    const middleware = validate(querySchema, 'query');

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.query).toEqual({ page: 2 });
  });

  it('should validate params', () => {
    const paramsSchema = z.object({ id: z.string().uuid() });
    const req = mockReq({}, {}, { id: '550e8400-e29b-41d4-a716-446655440000' });
    const res = mockRes();
    const next = vi.fn();
    const middleware = validate(paramsSchema, 'params');

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.params).toEqual({ id: '550e8400-e29b-41d4-a716-446655440000' });
  });

  it('should fail on invalid params', () => {
    const paramsSchema = z.object({ id: z.string().uuid() });
    const req = mockReq({}, {}, { id: 'not-a-uuid' });
    const res = mockRes();
    const next = vi.fn();
    const middleware = validate(paramsSchema, 'params');

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'VALIDATION_ERROR' }),
      }),
    );
  });

  it('should provide detailed validation errors', () => {
    const req = mockReq({ name: 123, age: 'invalid' });
    const res = mockRes();
    const next = vi.fn();
    const middleware = validate(testSchema);

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    const response = vi.mocked(res.json).mock.calls[0]![0];
    expect(response.error.details).toBeInstanceOf(Array);
    expect(response.error.details.length).toBeGreaterThan(0);
  });

  it('should default to validating body', () => {
    const req = mockReq({ name: 'Test', age: 25 });
    const res = mockRes();
    const next = vi.fn();

    const middleware = validate(testSchema);
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should call next with error for non-Zod errors', () => {
    const badSchema = {
      parse: () => {
        throw new Error('Unexpected');
      },
    } as any;
    const req = mockReq({});
    const res = mockRes();
    const next = vi.fn();

    const middleware = validate(badSchema);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
