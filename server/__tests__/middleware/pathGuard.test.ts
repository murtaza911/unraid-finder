import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { createPathGuard } from '../../src/middleware/pathGuard.js';

function mockReqResNext(user: any, queryPath?: string) {
  const req = { user, query: { path: queryPath }, params: { '0': queryPath } } as unknown as Request;
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() } as unknown as Response;
  const next = vi.fn() as NextFunction;
  return { req, res, next };
}

describe('Path Guard Middleware', () => {
  const browseRoot = '/browse';
  const guard = createPathGuard(browseRoot);

  it('allows admin access to any path', () => {
    const { req, res, next } = mockReqResNext({ role: 'admin', allowedPaths: ['*'] }, '/Media/movies');
    guard(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('allows user access to their permitted path', () => {
    const { req, res, next } = mockReqResNext({ role: 'full', allowedPaths: ['/browse/Media'] }, '/Media/movies');
    guard(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('blocks user access to non-permitted path', () => {
    const { req, res, next } = mockReqResNext({ role: 'full', allowedPaths: ['/browse/Media'] }, '/Backups/important');
    guard(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('blocks directory traversal attempts', () => {
    const { req, res, next } = mockReqResNext({ role: 'admin', allowedPaths: ['*'] }, '/../etc/passwd');
    guard(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
