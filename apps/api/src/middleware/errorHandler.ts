import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { logger } from '../utils/logger.js';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code: string = 'INTERNAL_ERROR',
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  logger.error('Unhandled error', {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        })),
      },
    });
    return;
  }

  if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Resource already exists',
          details: err.meta,
        },
      });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found',
        },
      });
      return;
    }
  }

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}
