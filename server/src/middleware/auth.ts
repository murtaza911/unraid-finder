import type { Request, Response, NextFunction } from 'express';

interface TokenPayload {
  id: number;
  username: string;
  role: 'admin' | 'full' | 'readonly';
  allowedPaths: string[];
}

declare global {
  namespace Express {
    interface Request { user?: TokenPayload; }
  }
}

type TokenVerifier = (token: string) => TokenPayload | null;

export function createAuthMiddleware(verifyToken: TokenVerifier) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Support token in query string for media URLs (img src, video src, etc.)
    const queryToken = req.query.token as string | undefined;
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else if (queryToken) {
      token = queryToken;
    }

    if (!token) { res.status(401).json({ error: 'Authentication required' }); return; }
    const payload = verifyToken(token);
    if (!payload) { res.status(401).json({ error: 'Invalid or expired token' }); return; }
    req.user = payload;
    next();
  };
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') { res.status(403).json({ error: 'Admin access required' }); return; }
  next();
}

export function requireWriteAccess(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role === 'readonly') { res.status(403).json({ error: 'Write access required' }); return; }
  next();
}
