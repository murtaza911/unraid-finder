import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import Database from 'better-sqlite3';
import { createTestDb } from '../../src/db/connection.js';
import { IndexerService } from '../../src/services/indexer.js';

describe('IndexerService', () => {
  let tmpDir: string;
  let db: Database.Database;
  let indexer: IndexerService;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'unraid-index-test-'));
    fs.mkdirSync(path.join(tmpDir, 'Media'));
    fs.mkdirSync(path.join(tmpDir, 'Media', 'Movies'));
    fs.writeFileSync(path.join(tmpDir, 'Media', 'photo.jpg'), 'fake');
    fs.writeFileSync(path.join(tmpDir, 'readme.txt'), 'hello');
    db = createTestDb();
    indexer = new IndexerService(db, tmpDir);
  });

  afterEach(() => { db.close(); fs.rmSync(tmpDir, { recursive: true, force: true }); });

  it('indexes all files in the browse root', async () => {
    await indexer.runFullIndex();
    const count = db.prepare('SELECT COUNT(*) as c FROM file_index').get() as { c: number };
    expect(count.c).toBe(4);
  });

  it('search returns matching files by name', async () => {
    await indexer.runFullIndex();
    const results = indexer.search('photo');
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('photo.jpg');
  });

  it('search is case-insensitive', async () => {
    await indexer.runFullIndex();
    const results = indexer.search('README');
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('readme.txt');
  });

  it('re-indexing updates the index without duplicates', async () => {
    await indexer.runFullIndex();
    fs.writeFileSync(path.join(tmpDir, 'newfile.txt'), 'new');
    await indexer.runFullIndex();
    const count = db.prepare('SELECT COUNT(*) as c FROM file_index').get() as { c: number };
    expect(count.c).toBe(5);
  });
});
