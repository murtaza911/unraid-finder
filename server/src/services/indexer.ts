import fs from 'node:fs';
import path from 'node:path';
import mime from 'mime-types';
import type Database from 'better-sqlite3';
import type { SearchResult } from '../types/index.js';

export class IndexerService {
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(private db: Database.Database, private browseRoot: string) {}

  async runFullIndex(): Promise<void> {
    const insertStmt = this.db.prepare(`
      INSERT OR REPLACE INTO file_index (path, name, is_directory, size, modified_at, file_type, parent_dir)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const currentPaths = new Set<string>();

    const indexDir = (dirPath: string) => {
      let entries: string[];
      try { entries = fs.readdirSync(dirPath); } catch { return; }
      for (const name of entries) {
        if (name.startsWith('.')) continue;
        const fullPath = path.join(dirPath, name);
        let stats: fs.Stats;
        try { stats = fs.statSync(fullPath); } catch { continue; }
        const relativePath = '/' + path.relative(this.browseRoot, fullPath);
        const parentDir = '/' + path.relative(this.browseRoot, dirPath);
        const fileType = stats.isDirectory() ? 'directory' : (mime.lookup(name) || null);
        currentPaths.add(relativePath);
        insertStmt.run(relativePath, name, stats.isDirectory() ? 1 : 0, stats.isDirectory() ? 0 : stats.size, stats.mtime.toISOString(), fileType, parentDir === '/.' ? '/' : parentDir);
        if (stats.isDirectory()) indexDir(fullPath);
      }
    };

    const runBatch = this.db.transaction(() => {
      indexDir(this.browseRoot);
      const allIndexed = this.db.prepare('SELECT path FROM file_index').all() as { path: string }[];
      for (const row of allIndexed) {
        if (!currentPaths.has(row.path)) this.db.prepare('DELETE FROM file_index WHERE path = ?').run(row.path);
      }
    });
    runBatch();
  }

  search(query: string, limit: number = 100): SearchResult[] {
    const rows = this.db.prepare(
      `SELECT path, name, is_directory, size, modified_at, parent_dir FROM file_index WHERE name LIKE ? ORDER BY name COLLATE NOCASE LIMIT ?`
    ).all(`%${query}%`, limit) as Array<{ path: string; name: string; is_directory: number; size: number; modified_at: string; parent_dir: string }>;
    return rows.map((row) => ({ path: row.path, name: row.name, isDirectory: row.is_directory === 1, size: row.size, modifiedAt: row.modified_at, parentDir: row.parent_dir }));
  }

  getStats(): { totalFiles: number; lastScan: string | null; indexSize: number } {
    const count = this.db.prepare('SELECT COUNT(*) as c FROM file_index').get() as { c: number };
    return { totalFiles: count.c, lastScan: new Date().toISOString(), indexSize: count.c * 300 };
  }

  startAutoIndex(intervalMinutes: number = 15): void {
    this.stopAutoIndex();
    this.intervalId = setInterval(() => { this.runFullIndex().catch(console.error); }, intervalMinutes * 60 * 1000);
    this.runFullIndex().catch(console.error);
  }

  stopAutoIndex(): void {
    if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
  }
}
