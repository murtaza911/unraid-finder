import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import Database from 'better-sqlite3';
import { createTestDb } from '../../src/db/connection.js';
import { AuthService } from '../../src/services/auth.js';
import { createAuthRoutes } from '../../src/routes/auth.js';

describe('Auth Routes', () => {
  let db: Database.Database;
  let app: express.Express;
  let authService: AuthService;

  beforeEach(() => {
    db = createTestDb();
    authService = new AuthService(db, 'test-secret');
    authService.createUser('admin', 'password123', 'admin', ['*']);
    app = express();
    app.use(express.json());
    app.use('/api/auth', createAuthRoutes(authService));
  });
  afterEach(() => { db.close(); });

  it('POST /api/auth/login returns token for valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.username).toBe('admin');
  });

  it('POST /api/auth/login returns 401 for invalid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('GET /api/auth/me returns current user', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'password123' });
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${loginRes.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.username).toBe('admin');
  });
});
