import { Router } from 'express';
import type { AuthService } from '../services/auth.js';
import { requireAdmin } from '../middleware/auth.js';

export function createUsersRoutes(authService: AuthService): Router {
  const router = Router();
  router.use(requireAdmin);
  router.get('/', (_req, res) => { res.json(authService.getAllUsers()); });
  router.post('/', (req, res) => {
    try {
      const { username, password, role, allowedPaths } = req.body;
      if (!username || !password) { res.status(400).json({ error: 'Username and password required' }); return; }
      res.status(201).json(authService.createUser(username, password, role || 'readonly', allowedPaths || ['*']));
    } catch (err: any) { res.status(400).json({ error: err.message }); }
  });
  router.put('/:id', (req, res) => {
    try { const id = parseInt(req.params.id); authService.updateUser(id, req.body); res.json(authService.getUser(id)); }
    catch (err: any) { res.status(400).json({ error: err.message }); }
  });
  router.delete('/:id', (req, res) => {
    try { authService.deleteUser(parseInt(req.params.id)); res.json({ success: true }); }
    catch (err: any) { res.status(400).json({ error: err.message }); }
  });
  return router;
}
