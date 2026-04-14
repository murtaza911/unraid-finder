import type { Request, Response, NextFunction } from 'express';
import path from 'node:path';

export function createPathGuard(browseRoot: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const requestedPath = req.query.path as string || req.params[0] || '/';
    const resolved = path.resolve(browseRoot, requestedPath.replace(/^\//, ''));
    if (!resolved.startsWith(browseRoot)) { res.status(403).json({ error: 'Access denied: invalid path' }); return; }
    if (req.user?.allowedPaths.includes('*')) { next(); return; }
    const fullPath = path.join(browseRoot, requestedPath.replace(/^\//, ''));
    const allowed = req.user?.allowedPaths.some((allowedPath) => fullPath.startsWith(allowedPath) || fullPath === allowedPath);
    if (!allowed) { res.status(403).json({ error: 'Access denied: path not permitted' }); return; }
    next();
  };
}
