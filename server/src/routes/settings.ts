import { Router } from 'express';
import fs from 'node:fs';
import type Database from 'better-sqlite3';
import { requireAdmin } from '../middleware/auth.js';

export function createSettingsRoutes(db: Database.Database, browseRoot: string): Router {
  const router = Router();
  router.get('/', (_req, res) => {
    const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
    const settings: Record<string, string> = {};
    for (const row of rows) settings[row.key] = row.value;
    res.json(settings);
  });
  router.put('/', requireAdmin, (req, res) => {
    const upsert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
    db.transaction(() => { for (const [key, value] of Object.entries(req.body)) upsert.run(key, String(value)); })();
    res.json({ success: true });
  });
  router.get('/paths', (_req, res) => {
    const savedPaths = db.prepare('SELECT * FROM browse_paths ORDER BY sort_order').all() as Array<{ mount_path: string; display_name: string; visible: number; sort_order: number }>;
    let mountedDirs: string[] = [];
    try { mountedDirs = fs.readdirSync(browseRoot).filter((name) => { const fp = `${browseRoot}/${name}`; return fs.statSync(fp).isDirectory() && !name.startsWith('.'); }).map((name) => `${browseRoot}/${name}`); } catch {}
    const savedMap = new Map(savedPaths.map((p) => [p.mount_path, p]));
    res.json(mountedDirs.map((mp, index) => { const saved = savedMap.get(mp); return { mountPath: mp, displayName: saved?.display_name || mp.split('/').pop() || mp, visible: saved ? saved.visible === 1 : true, sortOrder: saved?.sort_order ?? index }; }));
  });
  router.put('/paths', requireAdmin, (req, res) => {
    const upsert = db.prepare('INSERT INTO browse_paths (mount_path, display_name, visible, sort_order) VALUES (?, ?, ?, ?) ON CONFLICT(mount_path) DO UPDATE SET display_name = excluded.display_name, visible = excluded.visible, sort_order = excluded.sort_order');
    db.transaction(() => { for (const p of req.body) upsert.run(p.mountPath, p.displayName, p.visible ? 1 : 0, p.sortOrder); })();
    res.json({ success: true });
  });
  return router;
}
