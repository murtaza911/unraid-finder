import { Router } from 'express';
import type { FileSystemService } from '../services/fileSystem.js';

export function createFilesRoutes(fss: FileSystemService): Router {
  const router = Router();
  router.get('/list', (req, res) => { try { res.json(fss.listDirectory((req.query.path as string) || '/')); } catch (err: any) { res.status(400).json({ error: err.message }); } });
  router.get('/info', (req, res) => { try { const p = req.query.path as string; if (!p) { res.status(400).json({ error: 'Path required' }); return; } res.json(fss.getInfo(p)); } catch (err: any) { res.status(404).json({ error: err.message }); } });
  router.post('/mkdir', (req, res) => { try { fss.createDirectory(req.body.path); res.status(201).json({ success: true }); } catch (err: any) { res.status(400).json({ error: err.message }); } });
  router.post('/rename', (req, res) => { try { fss.rename(req.body.path, req.body.newName); res.json({ success: true }); } catch (err: any) { res.status(400).json({ error: err.message }); } });
  router.post('/copy', (req, res) => { try { fss.copy(req.body.source, req.body.destination); res.json({ success: true }); } catch (err: any) { res.status(400).json({ error: err.message }); } });
  router.post('/move', (req, res) => { try { fss.move(req.body.source, req.body.destination); res.json({ success: true }); } catch (err: any) { res.status(400).json({ error: err.message }); } });
  router.delete('/', (req, res) => { try { fss.delete(req.body.path); res.json({ success: true }); } catch (err: any) { res.status(400).json({ error: err.message }); } });
  router.get('/disk', (_req, res) => { try { res.json(fss.getDiskUsage()); } catch (err: any) { res.status(500).json({ error: err.message }); } });
  return router;
}
