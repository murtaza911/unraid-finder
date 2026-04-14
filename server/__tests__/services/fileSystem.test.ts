import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { FileSystemService } from '../../src/services/fileSystem.js';

describe('FileSystemService', () => {
  let tmpDir: string;
  let fss: FileSystemService;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'unraid-finder-test-'));
    fs.mkdirSync(path.join(tmpDir, 'Media'));
    fs.mkdirSync(path.join(tmpDir, 'Media', 'Movies'));
    fs.writeFileSync(path.join(tmpDir, 'Media', 'photo.jpg'), 'fake-image');
    fs.writeFileSync(path.join(tmpDir, 'readme.txt'), 'hello');
    fss = new FileSystemService(tmpDir);
  });

  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

  describe('listDirectory', () => {
    it('lists root directory entries', () => {
      const result = fss.listDirectory('/');
      expect(result.entries.length).toBe(2);
      const names = result.entries.map((e) => e.name).sort();
      expect(names).toEqual(['Media', 'readme.txt']);
    });
    it('lists nested directory', () => {
      const result = fss.listDirectory('/Media');
      expect(result.entries.length).toBe(2);
    });
    it('marks directories correctly', () => {
      const result = fss.listDirectory('/');
      expect(result.entries.find((e) => e.name === 'Media')?.isDirectory).toBe(true);
      expect(result.entries.find((e) => e.name === 'readme.txt')?.isDirectory).toBe(false);
    });
  });

  describe('createDirectory', () => {
    it('creates a new directory', () => {
      fss.createDirectory('/NewFolder');
      expect(fs.existsSync(path.join(tmpDir, 'NewFolder'))).toBe(true);
    });
  });

  describe('rename', () => {
    it('renames a file', () => {
      fss.rename('/readme.txt', 'notes.txt');
      expect(fs.existsSync(path.join(tmpDir, 'notes.txt'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'readme.txt'))).toBe(false);
    });
  });

  describe('copy', () => {
    it('copies a file to a new location', () => {
      fss.copy('/readme.txt', '/Media/readme.txt');
      expect(fs.existsSync(path.join(tmpDir, 'Media', 'readme.txt'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'readme.txt'))).toBe(true);
    });
  });

  describe('move', () => {
    it('moves a file to a new location', () => {
      fss.move('/readme.txt', '/Media/readme.txt');
      expect(fs.existsSync(path.join(tmpDir, 'Media', 'readme.txt'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'readme.txt'))).toBe(false);
    });
  });

  describe('delete', () => {
    it('deletes a file', () => {
      fss.delete('/readme.txt');
      expect(fs.existsSync(path.join(tmpDir, 'readme.txt'))).toBe(false);
    });
    it('deletes a directory recursively', () => {
      fss.delete('/Media');
      expect(fs.existsSync(path.join(tmpDir, 'Media'))).toBe(false);
    });
  });

  describe('getInfo', () => {
    it('returns file metadata', () => {
      const info = fss.getInfo('/readme.txt');
      expect(info.name).toBe('readme.txt');
      expect(info.isDirectory).toBe(false);
      expect(info.size).toBe(5);
      expect(info.extension).toBe('.txt');
    });
  });
});
