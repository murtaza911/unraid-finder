import fs from 'node:fs';
import path from 'node:path';
import archiver from 'archiver';
import unzipper from 'unzipper';

export class ZipService {
  constructor(private browseRoot: string) {}

  private resolve(relativePath: string): string {
    const cleaned = relativePath.replace(/^\//, '');
    const absolute = path.resolve(this.browseRoot, cleaned);
    if (!absolute.startsWith(this.browseRoot)) throw new Error('Path traversal detected');
    return absolute;
  }

  async createZip(sourcePaths: string[], destPath: string): Promise<string> {
    const absDest = this.resolve(destPath);
    const output = fs.createWriteStream(absDest);
    const archive = archiver('zip', { zlib: { level: 6 } });
    return new Promise((resolve, reject) => {
      output.on('close', () => resolve(absDest));
      archive.on('error', reject);
      archive.pipe(output);
      for (const srcPath of sourcePaths) {
        const absSrc = this.resolve(srcPath);
        const stats = fs.statSync(absSrc);
        const name = path.basename(absSrc);
        if (stats.isDirectory()) archive.directory(absSrc, name);
        else archive.file(absSrc, { name });
      }
      archive.finalize();
    });
  }

  async extractZip(zipPath: string, destPath: string): Promise<void> {
    const absZip = this.resolve(zipPath);
    const absDest = this.resolve(destPath);
    return new Promise((resolve, reject) => {
      fs.createReadStream(absZip)
        .pipe(unzipper.Extract({ path: absDest }))
        .on('close', resolve)
        .on('error', reject);
    });
  }
}
