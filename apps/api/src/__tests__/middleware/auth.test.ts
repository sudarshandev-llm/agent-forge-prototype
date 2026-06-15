import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import {
  authenticate,
  optionalAuth,
  requireRole,
  requireApiKey,
  AuthPayload,
} from '../../middleware/auth.js';
import { config } from '../../config/index.js';
import { ApiError } from '../../middleware/errorHandler.js';

vi.mock('../../config/index.js', () => ({
  config: {
    jwt: { secret: 'test-secret', expiresIn: '7d' },
    env: 'test',
  },
}));

function mockReq(headers: Record<string, string> = {}) {
  return {
    headers: { authorization: 'Bearer valid-token', ...headers },
    user: undefined,
    authToken: undefined,
  } as any;
}

function mockRes() {
  return {} as any;
}

describe('auth middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should set user and token for valid JWT', () => {
      const payload: AuthPayload = { userId: 'user-1', email: 'test@test.com', roles: ['user'] };
      vi.spyOn(jwt, 'verify').mockReturnValue(payload as any);

      const req = mockReq();
      const next = vi.fn();

      authenticate(req, mockRes(), next);

      expect(req.user).toEqual(payload);
      expect(req.authToken).toBe('valid-token');
      expect(next).toHaveBeenCalled();
    });

    it('should throw 401 when no authorization header', () => {
      const req = { headers: {} } as any;
      const next = vi.fn();

      expect(() => authenticate(req, mockRes(), next)).toThrow(ApiError);
      expect(() => authenticate(req, mockRes(), next)).toThrow('Authentication required');
    });

    it('should throw 401 on invalid header format', () => {
      const req = { headers: { authorization: 'InvalidFormat' } } as any;
      const next = vi.fn();

      expect(() => authenticate(req, mockRes(), next)).toThrow(
        'Invalid authorization header format',
      );
    });

    it('should throw 401 on expired token', () => {
      vi.spyOn(jwt, 'verify').mockImplementation(() => {
        throw new jwt.TokenExpiredError('jwt expired', new Date());
      });

      const req = mockReq();
      const next = vi.fn();

      expect(() => authenticate(req, mockRes(), next)).toThrow('Token expired');
    });

    it('should throw 401 on invalid token', () => {
      vi.spyOn(jwt, 'verify').mockImplementation(() => {
        throw new jwt.JsonWebTokenError('invalid token');
      });

      const req = mockReq();
      const next = vi.fn();

      expect(() => authenticate(req, mockRes(), next)).toThrow('Invalid token');
    });

    it('should throw 401 on general verification error', () => {
      vi.spyOn(jwt, 'verify').mockImplementation(() => {
        throw new Error('Something went wrong');
      });

      const req = mockReq();
      const next = vi.fn();

      expect(() => authenticate(req, mockRes(), next)).toThrow('Authentication failed');
    });

    it('should throw 401 when token not provided', () => {
      const req = { headers: { authorization: 'Bearer ' } } as any;
      const next = vi.fn();

      expect(() => authenticate(req, mockRes(), next)).toThrow('Token not provided');
    });
  });

  describe('optionalAuth', () => {
    it('should set user when valid token provided', () => {
      const payload: AuthPayload = { userId: 'user-1', email: 'test@test.com', roles: ['user'] };
      vi.spyOn(jwt, 'verify').mockReturnValue(payload as any);

      const req = mockReq();
      const next = vi.fn();

      optionalAuth(req, mockRes(), next);

      expect(req.user).toEqual(payload);
      expect(next).toHaveBeenCalled();
    });

    it('should continue silently when no auth header', () => {
      const req = { headers: {} } as any;
      const next = vi.fn();

      optionalAuth(req, mockRes(), next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });

    it('should continue silently on invalid header format', () => {
      const req = { headers: { authorization: 'Invalid' } } as any;
      const next = vi.fn();

      optionalAuth(req, mockRes(), next);

      expect(next).toHaveBeenCalled();
    });

    it('should continue silently when token verification fails', () => {
      vi.spyOn(jwt, 'verify').mockImplementation(() => {
        throw new Error('bad');
      });

      const req = mockReq();
      const next = vi.fn();

      optionalAuth(req, mockRes(), next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });
  });

  describe('requireRole', () => {
    it('should allow user with required role', () => {
      const req = { user: { userId: 'user-1', roles: ['admin', 'user'] } } as any;
      const next = vi.fn();

      const middleware = requireRole('admin');
      middleware(req, mockRes(), next);

      expect(next).toHaveBeenCalled();
    });

    it('should throw 403 when user lacks role', () => {
      const req = { user: { userId: 'user-1', roles: ['user'] } } as any;
      const next = vi.fn();

      const middleware = requireRole('admin');
      expect(() => middleware(req, mockRes(), next)).toThrow(ApiError);
      expect(() => middleware(req, mockRes(), next)).toThrow('Insufficient permissions');
    });

    it('should throw 401 when no user', () => {
      const req = { user: undefined } as any;
      const next = vi.fn();

      const middleware = requireRole('admin');
      expect(() => middleware(req, mockRes(), next)).toThrow('Authentication required');
    });

    it('should succeed when user has any of the required roles', () => {
      const req = { user: { userId: 'user-1', roles: ['moderator'] } } as any;
      const next = vi.fn();

      const middleware = requireRole('admin', 'moderator', 'owner');
      middleware(req, mockRes(), next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('requireApiKey', () => {
    it('should set authToken when API key provided', () => {
      const req = { headers: { 'x-api-key': 'sk-12345' }, authToken: undefined } as any;
      const next = vi.fn();

      requireApiKey(req, mockRes(), next);

      expect(req.authToken).toBe('sk-12345');
      expect(next).toHaveBeenCalled();
    });

    it('should throw 401 when no API key', () => {
      const req = { headers: {} } as any;
      const next = vi.fn();

      expect(() => requireApiKey(req, mockRes(), next)).toThrow(ApiError);
      expect(() => requireApiKey(req, mockRes(), next)).toThrow('API key required');
    });
  });
});
