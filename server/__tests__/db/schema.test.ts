import { describe, it, expect, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { initializeSchema } from '../../src/db/schema.js';

describe('Database Schema', () => {
  let db: Database.Database;
  afterEach(() => { if (db) db.close(); });

  it('creates all required tables', () => {
    db = new Database(':memory:');
    initializeSchema(db);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all() as { name: string }[];
    const tableNames = tables.map((t) => t.name);
    expect(tableNames).toContain('users');
    expect(tableNames).toContain('settings');
    expect(tableNames).toContain('browse_paths');
    expect(tableNames).toContain('tags');
    expect(tableNames).toContain('file_tags');
    expect(tableNames).toContain('file_index');
    expect(tableNames).toContain('favorites');
  });

  it('is idempotent — running twice does not error', () => {
    db = new Database(':memory:');
    initializeSchema(db);
    expect(() => initializeSchema(db)).not.toThrow();
  });
});
