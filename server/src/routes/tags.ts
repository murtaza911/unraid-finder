import { Router } from 'express';
import type Database from 'better-sqlite3';

export function createTagsRoutes(db: Database.Database): Router {
  const router = Router();
  router.get('/', (_req, res) => { res.json(db.prepare('SELECT * FROM tags ORDER BY name').all()); });
  router.post('/', (req, res) => {
    try {
      const { name, color } = req.body;
      if (!name) { res.status(400).json({ error: 'Tag name required' }); return; }
      const result = db.prepare('INSERT INTO tags (name, color) VALUES (?, ?)').run(name, color || '#808080');
      res.status(201).json({ id: result.lastInsertRowid, name, color: color || '#808080' });
    } catch (err: any) { res.status(400).json({ error: err.message }); }
  });
  router.delete('/:id', (req, res) => { db.prepare('DELETE FROM tags WHERE id = ?').run(parseInt(req.params.id)); res.json({ success: true }); });
  router.post('/file', (req, res) => {
    try { db.prepare('INSERT OR IGNORE INTO file_tags (file_path, tag_id) VALUES (?, ?)').run(req.body.filePath, req.body.tagId); res.json({ success: true }); }
    catch (err: any) { res.status(400).json({ error: err.message }); }
  });
  router.delete('/file', (req, res) => { db.prepare('DELETE FROM file_tags WHERE file_path = ? AND tag_id = ?').run(req.body.filePath, req.body.tagId); res.json({ success: true }); });
  router.get('/file', (req, res) => { res.json(db.prepare('SELECT t.* FROM tags t INNER JOIN file_tags ft ON t.id = ft.tag_id WHERE ft.file_path = ?').all(req.query.path as string)); });
  return router;
}
