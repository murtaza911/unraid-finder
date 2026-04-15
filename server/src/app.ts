import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { getDb } from './db/connection.js';
import { AuthService } from './services/auth.js';
import { FileSystemService } from './services/fileSystem.js';
import { IndexerService } from './services/indexer.js';
import { ZipService } from './services/zip.js';
import { createAuthMiddleware } from './middleware/auth.js';
import { createAuthRoutes } from './routes/auth.js';
import { createFilesRoutes } from './routes/files.js';
import { createUploadRoutes } from './routes/upload.js';
import { createDownloadRoutes } from './routes/download.js';
import { createSearchRoutes } from './routes/search.js';
import { createUsersRoutes } from './routes/users.js';
import { createTagsRoutes } from './routes/tags.js';
import { createSettingsRoutes } from './routes/settings.js';

export function createApp() {
  const app = express();
  const BROWSE_ROOT = process.env.BROWSE_ROOT || '/browse';
  const JWT_SECRET = process.env.JWT_SECRET || 'unraid-finder-secret-change-me';
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  const INDEX_INTERVAL = parseInt(process.env.INDEX_INTERVAL_MINUTES || '15');

  const db = getDb();
  const authService = new AuthService(db, JWT_SECRET);
  const fss = new FileSystemService(BROWSE_ROOT);
  const zipService = new ZipService(BROWSE_ROOT);
  const indexer = new IndexerService(db, BROWSE_ROOT);

  // Create admin user on first launch
  if (ADMIN_PASSWORD && !authService.userExists(ADMIN_USERNAME)) {
    authService.createUser(ADMIN_USERNAME, ADMIN_PASSWORD, 'admin', ['*']);
    console.log(`Admin user "${ADMIN_USERNAME}" created.`);
  }

  // Start background indexer
  indexer.startAutoIndex(INDEX_INTERVAL);

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Auth routes (public)
  app.use('/api/auth', createAuthRoutes(authService));

  // Protected routes
  const authMiddleware = createAuthMiddleware((token) => authService.verifyToken(token));
  app.use('/api/files', authMiddleware, createFilesRoutes(fss));
  app.use('/api/upload', authMiddleware, createUploadRoutes(BROWSE_ROOT));
  app.use('/api/download', authMiddleware, createDownloadRoutes(fss, zipService));
  app.use('/api/search', authMiddleware, createSearchRoutes(indexer));
  app.use('/api/users', authMiddleware, createUsersRoutes(authService));
  app.use('/api/tags', authMiddleware, createTagsRoutes(db));
  app.use('/api/settings', authMiddleware, createSettingsRoutes(db, BROWSE_ROOT));

  // Serve React app in production
  const clientDist = process.env.CLIENT_DIST || path.resolve(__dirname, '..', '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('/{*path}', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });

  return { app, indexer };
}
