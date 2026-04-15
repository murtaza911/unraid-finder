import fs from 'node:fs';
import path from 'node:path';
import mime from 'mime-types';
import type { FileEntry, DirectoryListing } from '../types/index.js';

export class FileSystemService {
  constructor(private browseRoot: string) {}

  private resolve(relativePath: string): string {
    const cleaned = relativePath.replace(/^\//, '');
    const absolute = path.resolve(this.browseRoot, cleaned);
    if (!absolute.startsWith(this.browseRoot)) throw new Error('Path traversal detected');
    return absolute;
  }

  private toRelative(absolute: string): string {
    return '/' + path.relative(this.browseRoot, absolute);
  }

  private statToEntry(filePath: string, stats: fs.Stats): FileEntry {
    const name = path.basename(filePath);
    const ext = path.extname(name) || null;
    return {
      name, path: this.toRelative(filePath), isDirectory: stats.isDirectory(),
      size: stats.isDirectory() ? 0 : stats.size,
      modifiedAt: stats.mtime.toISOString(), createdAt: stats.birthtime.toISOString(),
      mimeType: stats.isDirectory() ? null : (mime.lookup(name) || null), extension: ext,
    };
  }

  listDirectory(relativePath: string): DirectoryListing {
    const absolute = this.resolve(relativePath);
    const names = fs.readdirSync(absolute);
    const entries: FileEntry[] = [];
    for (const name of names) {
      if (name.startsWith('.')) continue;
      const fullPath = path.join(absolute, name);
      try { entries.push(this.statToEntry(fullPath, fs.statSync(fullPath))); } catch { /* skip */ }
    }
    return { path: relativePath, entries, totalItems: entries.length };
  }

  getInfo(relativePath: string): FileEntry {
    const absolute = this.resolve(relativePath);
    return this.statToEntry(absolute, fs.statSync(absolute));
  }

  createDirectory(relativePath: string): void { fs.mkdirSync(this.resolve(relativePath), { recursive: true }); }

  rename(relativePath: string, newName: string): void {
    const absolute = this.resolve(relativePath);
    const newPath = path.join(path.dirname(absolute), newName);
    if (!newPath.startsWith(this.browseRoot)) throw new Error('Path traversal detected');
    fs.renameSync(absolute, newPath);
  }

  copy(sourcePath: string, destPath: string): void {
    const absSrc = this.resolve(sourcePath);
    const absDest = this.resolve(destPath);
    const stats = fs.statSync(absSrc);
    if (stats.isDirectory()) { fs.cpSync(absSrc, absDest, { recursive: true }); }
    else { fs.mkdirSync(path.dirname(absDest), { recursive: true }); fs.copyFileSync(absSrc, absDest); }
  }

  move(sourcePath: string, destPath: string): void {
    const absSrc = this.resolve(sourcePath);
    const absDest = this.resolve(destPath);
    fs.mkdirSync(path.dirname(absDest), { recursive: true });
    fs.renameSync(absSrc, absDest);
  }

  delete(relativePath: string): void { fs.rmSync(this.resolve(relativePath), { recursive: true, force: true }); }

  exists(relativePath: string): boolean {
    try { fs.accessSync(this.resolve(relativePath)); return true; } catch { return false; }
  }

  getAbsolutePath(relativePath: string): string { return this.resolve(relativePath); }

  getDiskUsage(relativePath?: string): { total: number; free: number } {
    const target = relativePath ? this.resolve(relativePath) : this.browseRoot;
    const stats = fs.statfsSync(target);
    return { total: stats.blocks * stats.bsize, free: stats.bfree * stats.bsize };
  }
}
