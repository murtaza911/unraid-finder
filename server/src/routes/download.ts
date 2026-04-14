import { Router } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import archiver from 'archiver';
import type { FileSystemService } from '../services/fileSystem.js';
import type { ZipService } from '../services/zip.js';

export function createDownloadRoutes(fss: FileSystemService, zipService: ZipService): Router {
  const router = Router();
  router.get('/', (req, res) => {
    try {
      const filePath = req.query.path as string;
      if (!filePath) { res.status(400).json({ error: 'Path required' }); return; }
      const absolutePath = fss.getAbsolutePath(filePath);
      res.download(absolutePath, path.basename(absolutePath));
    } catch (err: any) { res.status(404).json({ error: err.message }); }
  });
  router.post('/zip', (req, res) => {
    const { paths } = req.body;
    if (!paths || !Array.isArray(paths) || paths.length === 0) { res.status(400).json({ error: 'Paths array required' }); return; }
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="download.zip"');
    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.on('error', (err) => { if (!res.headersSent) res.status(500).json({ error: err.message }); });
    archive.pipe(res);
    for (const srcPath of paths) {
      try {
        const absolutePath = fss.getAbsolutePath(srcPath);
        const stats = fs.statSync(absolutePath);
        const name = path.basename(absolutePath);
        if (stats.isDirectory()) archive.directory(absolutePath, name);
        else archive.file(absolutePath, { name });
      } catch { /* skip invalid paths */ }
    }
    archive.finalize();
  });
  return router;
}
