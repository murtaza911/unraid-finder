import { Router } from 'express';
import type { IndexerService } from '../services/indexer.js';

export function createSearchRoutes(indexer: IndexerService): Router {
  const router = Router();
  router.get('/', (req, res) => {
    const query = req.query.q as string;
    if (!query) { res.status(400).json({ error: 'Query parameter q required' }); return; }
    const limit = parseInt(req.query.limit as string) || 100;
    res.json({ results: indexer.search(query, limit), total: indexer.search(query, limit).length });
  });
  router.get('/stats', (_req, res) => { res.json(indexer.getStats()); });
  router.post('/reindex', async (_req, res) => {
    try { await indexer.runFullIndex(); res.json({ success: true, stats: indexer.getStats() }); }
    catch (err: any) { res.status(500).json({ error: err.message }); }
  });
  return router;
}
