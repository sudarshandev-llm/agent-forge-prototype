import { describe, it, expect, vi, beforeEach } from 'vitest';
import { errorHandler, ApiError } from '../../middleware/errorHandler.js';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '../../utils/logger.js';

vi.mock('../../utils/logger.js', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    http: vi.fn(),
    debug: vi.fn(),
  },
}));

function mockReq() {
  return {} as any;
}

function mockRes() {
  const res: any = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
}

describe('errorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle ApiError with correct status and code', () => {
    const err = new ApiError(404, 'Resource not found', 'NOT_FOUND', { resource: 'agent' });
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Resource not found', details: { resource: 'agent' } },
    });
  });

  it('should handle ApiError with default code', () => {
    const err = new ApiError(500, 'Something broke');
    const req = mockReq();
    const res = mockRes();

    errorHandler(err, req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Something broke', details: undefined },
    });
  });

  it('should handle ZodError', () => {
    const zodErr = new ZodError([
      { path: ['email'], message: 'Invalid email', code: 'invalid_string' },
      { path: ['name'], message: 'Required', code: 'too_small' },
    ] as any);
    const req = mockReq();
    const res = mockRes();

    errorHandler(zodErr, req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: [
          { field: 'email', message: 'Invalid email', code: 'invalid_string' },
          { field: 'name', message: 'Required', code: 'too_small' },
        ],
      },
    });
  });

  it('should handle Prisma P2002 unique constraint error', () => {
    const prismaErr = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
      code: 'P2002',
      clientVersion: '5.0',
      meta: { target: ['email'] },
    });
    const req = mockReq();
    const res = mockRes();

    errorHandler(prismaErr, req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'CONFLICT', message: 'Resource already exists', details: prismaErr.meta },
    });
  });

  it('should handle Prisma P2025 not found error', () => {
    const prismaErr = new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '5.0',
    });
    const req = mockReq();
    const res = mockRes();

    errorHandler(prismaErr, req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Resource not found' },
    });
  });

  it('should handle other Prisma errors as 500', () => {
    const prismaErr = new Prisma.PrismaClientKnownRequestError('DB error', {
      code: 'P2000',
      clientVersion: '5.0',
    });
    const req = mockReq();
    const res = mockRes();

    errorHandler(prismaErr, req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('should handle unknown errors as 500', () => {
    const err = new Error('Something unexpected');
    const req = mockReq();
    const res = mockRes();

    errorHandler(err, req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
  });

  it('should log all errors', () => {
    const err = new Error('Test error');
    const req = mockReq();
    const res = mockRes();

    errorHandler(err, req, res, vi.fn());

    expect(logger.error).toHaveBeenCalledWith('Unhandled error', {
      name: 'Error',
      message: 'Test error',
      stack: expect.any(String),
    });
  });
});
