import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type Database from 'better-sqlite3';
import type { User, UserRow } from '../types/index.js';

interface TokenPayload {
  id: number;
  username: string;
  role: 'admin' | 'full' | 'readonly';
  allowedPaths: string[];
}

const SALT_ROUNDS = 12;

export class AuthService {
  constructor(private db: Database.Database, private jwtSecret: string, private sessionDays: number = 7) {}

  createUser(username: string, password: string, role: 'admin' | 'full' | 'readonly', allowedPaths: string[]): User {
    const hash = bcrypt.hashSync(password, SALT_ROUNDS);
    const stmt = this.db.prepare('INSERT INTO users (username, password_hash, role, allowed_paths) VALUES (?, ?, ?, ?)');
    const result = stmt.run(username, hash, role, JSON.stringify(allowedPaths));
    return { id: result.lastInsertRowid as number, username, role, allowedPaths, createdAt: new Date().toISOString() };
  }

  authenticate(username: string, password: string): { token: string; user: User } | null {
    const row = this.db.prepare('SELECT * FROM users WHERE username = ?').get(username) as UserRow | undefined;
    if (!row || !bcrypt.compareSync(password, row.password_hash)) return null;
    const user: User = { id: row.id, username: row.username, role: row.role, allowedPaths: JSON.parse(row.allowed_paths), createdAt: row.created_at };
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role, allowedPaths: user.allowedPaths }, this.jwtSecret, { expiresIn: `${this.sessionDays}d` });
    return { token, user };
  }

  verifyToken(token: string): TokenPayload | null {
    try { return jwt.verify(token, this.jwtSecret) as TokenPayload; } catch { return null; }
  }

  getUser(id: number): User | null {
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
    if (!row) return null;
    return { id: row.id, username: row.username, role: row.role, allowedPaths: JSON.parse(row.allowed_paths), createdAt: row.created_at };
  }

  getAllUsers(): User[] {
    const rows = this.db.prepare('SELECT * FROM users').all() as UserRow[];
    return rows.map((row) => ({ id: row.id, username: row.username, role: row.role, allowedPaths: JSON.parse(row.allowed_paths), createdAt: row.created_at }));
  }

  updateUser(id: number, updates: { role?: string; allowedPaths?: string[]; password?: string }): void {
    if (updates.role) this.db.prepare('UPDATE users SET role = ? WHERE id = ?').run(updates.role, id);
    if (updates.allowedPaths) this.db.prepare('UPDATE users SET allowed_paths = ? WHERE id = ?').run(JSON.stringify(updates.allowedPaths), id);
    if (updates.password) { const hash = bcrypt.hashSync(updates.password, SALT_ROUNDS); this.db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, id); }
  }

  deleteUser(id: number): void { this.db.prepare('DELETE FROM users WHERE id = ?').run(id); }

  userExists(username: string): boolean {
    return !!this.db.prepare('SELECT 1 FROM users WHERE username = ?').get(username);
  }
}
