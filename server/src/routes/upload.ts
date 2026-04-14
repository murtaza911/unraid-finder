import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';

export function createUploadRoutes(browseRoot: string): Router {
  const router = Router();
  const storage = multer.diskStorage({
    destination: (req, _file, cb) => {
      const uploadPath = (req.body.path as string) || '/';
      const cleaned = uploadPath.replace(/^\//, '');
      const absolute = path.resolve(browseRoot, cleaned);
      if (!absolute.startsWith(browseRoot)) { cb(new Error('Invalid path'), ''); return; }
      fs.mkdirSync(absolute, { recursive: true });
      cb(null, absolute);
    },
    filename: (_req, file, cb) => { cb(null, file.originalname); },
  });
  const upload = multer({ storage });
  router.post('/', upload.array('files', 100), (req, res) => {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) { res.status(400).json({ error: 'No files provided' }); return; }
    res.json({ success: true, uploaded: files.map((f) => ({ name: f.originalname, size: f.size })) });
  });
  return router;
}
