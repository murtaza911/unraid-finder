import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createFilesRoutes } from '../../src/routes/files.js';
import { FileSystemService } from '../../src/services/fileSystem.js';

describe('Files Routes', () => {
  let tmpDir: string;
  let app: express.Express;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'unraid-files-test-'));
    fs.mkdirSync(path.join(tmpDir, 'Media'));
    fs.writeFileSync(path.join(tmpDir, 'test.txt'), 'hello world');
    const fss = new FileSystemService(tmpDir);
    app = express();
    app.use(express.json());
    app.use((req, _res, next) => { req.user = { id: 1, username: 'admin', role: 'admin', allowedPaths: ['*'] }; next(); });
    app.use('/api/files', createFilesRoutes(fss));
  });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

  it('GET /api/files/list lists directory', async () => {
    const res = await request(app).get('/api/files/list?path=/');
    expect(res.status).toBe(200);
    expect(res.body.entries.length).toBe(2);
  });
  it('POST /api/files/mkdir creates directory', async () => {
    const res = await request(app).post('/api/files/mkdir').send({ path: '/NewFolder' });
    expect(res.status).toBe(201);
    expect(fs.existsSync(path.join(tmpDir, 'NewFolder'))).toBe(true);
  });
  it('POST /api/files/rename renames file', async () => {
    const res = await request(app).post('/api/files/rename').send({ path: '/test.txt', newName: 'renamed.txt' });
    expect(res.status).toBe(200);
    expect(fs.existsSync(path.join(tmpDir, 'renamed.txt'))).toBe(true);
  });
  it('POST /api/files/copy copies file', async () => {
    const res = await request(app).post('/api/files/copy').send({ source: '/test.txt', destination: '/Media/test.txt' });
    expect(res.status).toBe(200);
    expect(fs.existsSync(path.join(tmpDir, 'Media', 'test.txt'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'test.txt'))).toBe(true);
  });
  it('POST /api/files/move moves file', async () => {
    const res = await request(app).post('/api/files/move').send({ source: '/test.txt', destination: '/Media/test.txt' });
    expect(res.status).toBe(200);
    expect(fs.existsSync(path.join(tmpDir, 'Media', 'test.txt'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'test.txt'))).toBe(false);
  });
  it('DELETE /api/files deletes file', async () => {
    const res = await request(app).delete('/api/files').send({ path: '/test.txt' });
    expect(res.status).toBe(200);
    expect(fs.existsSync(path.join(tmpDir, 'test.txt'))).toBe(false);
  });
  it('GET /api/files/info returns metadata', async () => {
    const res = await request(app).get('/api/files/info?path=/test.txt');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('test.txt');
    expect(res.body.size).toBe(11);
  });
});
