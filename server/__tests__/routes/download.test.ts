import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createDownloadRoutes } from '../../src/routes/download.js';
import { FileSystemService } from '../../src/services/fileSystem.js';
import { ZipService } from '../../src/services/zip.js';

describe('Download Routes', () => {
  let tmpDir: string;
  let app: express.Express;
  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'unraid-download-test-'));
    fs.writeFileSync(path.join(tmpDir, 'test.txt'), 'hello world');
    fs.writeFileSync(path.join(tmpDir, 'file2.txt'), 'content2');
    const fss = new FileSystemService(tmpDir);
    const zipService = new ZipService(tmpDir);
    app = express();
    app.use(express.json());
    app.use((req, _res, next) => { req.user = { id: 1, username: 'admin', role: 'admin', allowedPaths: ['*'] }; next(); });
    app.use('/api/download', createDownloadRoutes(fss, zipService));
  });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

  it('GET /api/download downloads a single file', async () => {
    const res = await request(app).get('/api/download?path=/test.txt');
    expect(res.status).toBe(200);
    expect(res.text).toBe('hello world');
  });
  it('POST /api/download/zip creates and downloads zip', async () => {
    const res = await request(app).post('/api/download/zip').send({ paths: ['/test.txt', '/file2.txt'] });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/zip');
  });
});
