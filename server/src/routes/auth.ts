import { Router } from 'express';
import type { AuthService } from '../services/auth.js';
import { createAuthMiddleware } from '../middleware/auth.js';

export function createAuthRoutes(authService: AuthService): Router {
  const router = Router();
  const authMiddleware = createAuthMiddleware((token) => authService.verifyToken(token));

  router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) { res.status(400).json({ error: 'Username and password required' }); return; }
    const result = authService.authenticate(username, password);
    if (!result) { res.status(401).json({ error: 'Invalid credentials' }); return; }
    res.json(result);
  });

  router.get('/me', authMiddleware, (req, res) => {
    if (!req.user) { res.status(401).json({ error: 'Not authenticated' }); return; }
    const user = authService.getUser(req.user.id);
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json(user);
  });

  return router;
}
