import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { createTestDb } from '../../src/db/connection.js';
import { AuthService } from '../../src/services/auth.js';

describe('AuthService', () => {
  let db: Database.Database;
  let auth: AuthService;

  beforeEach(() => { db = createTestDb(); auth = new AuthService(db, 'test-jwt-secret'); });
  afterEach(() => { db.close(); });

  describe('createUser', () => {
    it('creates a user and returns it without password hash', () => {
      const user = auth.createUser('admin', 'password123', 'admin', ['*']);
      expect(user.username).toBe('admin');
      expect(user.role).toBe('admin');
      expect(user.allowedPaths).toEqual(['*']);
      expect(user).not.toHaveProperty('password_hash');
    });
    it('throws on duplicate username', () => {
      auth.createUser('admin', 'pass1', 'admin', ['*']);
      expect(() => auth.createUser('admin', 'pass2', 'full', ['*'])).toThrow();
    });
  });

  describe('authenticate', () => {
    it('returns a JWT token for valid credentials', () => {
      auth.createUser('admin', 'password123', 'admin', ['*']);
      const result = auth.authenticate('admin', 'password123');
      expect(result).not.toBeNull();
      expect(result!.token).toBeDefined();
      expect(result!.user.username).toBe('admin');
    });
    it('returns null for wrong password', () => {
      auth.createUser('admin', 'password123', 'admin', ['*']);
      expect(auth.authenticate('admin', 'wrongpassword')).toBeNull();
    });
    it('returns null for non-existent user', () => {
      expect(auth.authenticate('nobody', 'password')).toBeNull();
    });
  });

  describe('verifyToken', () => {
    it('returns user data from valid token', () => {
      auth.createUser('admin', 'password123', 'admin', ['*']);
      const { token } = auth.authenticate('admin', 'password123')!;
      const payload = auth.verifyToken(token);
      expect(payload).not.toBeNull();
      expect(payload!.username).toBe('admin');
    });
    it('returns null for invalid token', () => {
      expect(auth.verifyToken('garbage-token')).toBeNull();
    });
  });
});
