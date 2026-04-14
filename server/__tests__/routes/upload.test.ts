import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createUploadRoutes } from '../../src/routes/upload.js';

describe('Upload Routes', () => {
  let tmpDir: string;
  let app: express.Express;
  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'unraid-upload-test-'));
    app = express();
    app.use(express.json());
    app.use((req, _res, next) => { req.user = { id: 1, username: 'admin', role: 'admin', allowedPaths: ['*'] }; next(); });
    app.use('/api/upload', createUploadRoutes(tmpDir));
  });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

  it('uploads a single file', async () => {
    const res = await request(app).post('/api/upload').field('path', '/').attach('files', Buffer.from('test content'), 'test.txt');
    expect(res.status).toBe(200);
    expect(fs.existsSync(path.join(tmpDir, 'test.txt'))).toBe(true);
    expect(fs.readFileSync(path.join(tmpDir, 'test.txt'), 'utf8')).toBe('test content');
  });
  it('uploads multiple files', async () => {
    const res = await request(app).post('/api/upload').field('path', '/').attach('files', Buffer.from('c1'), 'file1.txt').attach('files', Buffer.from('c2'), 'file2.txt');
    expect(res.status).toBe(200);
    expect(fs.existsSync(path.join(tmpDir, 'file1.txt'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'file2.txt'))).toBe(true);
  });
});
