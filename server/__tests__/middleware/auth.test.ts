import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { createAuthMiddleware } from '../../src/middleware/auth.js';

function mockReqResNext(authHeader?: string, queryToken?: string) {
  const req = { headers: { authorization: authHeader }, query: { token: queryToken } } as unknown as Request;
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() } as unknown as Response;
  const next = vi.fn() as NextFunction;
  return { req, res, next };
}

describe('Auth Middleware', () => {
  const validPayload = { id: 1, username: 'admin', role: 'admin' as const, allowedPaths: ['*'] };
  const verifyToken = vi.fn((token: string) => token === 'valid-token' ? validPayload : null);
  const middleware = createAuthMiddleware(verifyToken);

  it('calls next() with valid Bearer token', () => {
    const { req, res, next } = mockReqResNext('Bearer valid-token');
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect((req as any).user).toEqual(validPayload);
  });

  it('returns 401 when no auth header present', () => {
    const { req, res, next } = mockReqResNext(undefined);
    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for invalid token', () => {
    const { req, res, next } = mockReqResNext('Bearer bad-token');
    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
