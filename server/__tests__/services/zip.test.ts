import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { ZipService } from '../../src/services/zip.js';

describe('ZipService', () => {
  let tmpDir: string;
  let zipService: ZipService;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'unraid-zip-test-'));
    fs.writeFileSync(path.join(tmpDir, 'file1.txt'), 'content1');
    fs.writeFileSync(path.join(tmpDir, 'file2.txt'), 'content2');
    fs.mkdirSync(path.join(tmpDir, 'subdir'));
    fs.writeFileSync(path.join(tmpDir, 'subdir', 'file3.txt'), 'content3');
    zipService = new ZipService(tmpDir);
  });

  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

  it('creates a zip archive from multiple files', async () => {
    const zipPath = await zipService.createZip(['/file1.txt', '/file2.txt'], '/archive.zip');
    expect(fs.existsSync(zipPath)).toBe(true);
    expect(fs.statSync(zipPath).size).toBeGreaterThan(0);
  });

  it('creates a zip archive from a directory', async () => {
    const zipPath = await zipService.createZip(['/subdir'], '/subdir.zip');
    expect(fs.existsSync(zipPath)).toBe(true);
  });

  it('extracts a zip archive', async () => {
    const zipPath = await zipService.createZip(['/file1.txt', '/file2.txt'], '/test.zip');
    const extractDir = path.join(tmpDir, 'extracted');
    fs.mkdirSync(extractDir);
    await zipService.extractZip('/test.zip', '/extracted');
    expect(fs.existsSync(path.join(extractDir, 'file1.txt'))).toBe(true);
    expect(fs.existsSync(path.join(extractDir, 'file2.txt'))).toBe(true);
  });
});
