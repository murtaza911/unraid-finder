import type Database from 'better-sqlite3';

export function initializeSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'readonly' CHECK(role IN ('admin', 'full', 'readonly')),
      allowed_paths TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS browse_paths (
      mount_path TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      visible INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      color TEXT NOT NULL DEFAULT '#808080'
    );
    CREATE TABLE IF NOT EXISTS file_tags (
      file_path TEXT NOT NULL,
      tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (file_path, tag_id)
    );
    CREATE TABLE IF NOT EXISTS file_index (
      path TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      is_directory INTEGER NOT NULL,
      size INTEGER NOT NULL DEFAULT 0,
      modified_at TEXT NOT NULL,
      file_type TEXT,
      parent_dir TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_file_index_name ON file_index(name COLLATE NOCASE);
    CREATE INDEX IF NOT EXISTS idx_file_index_parent ON file_index(parent_dir);
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      path TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      UNIQUE(user_id, path)
    );
  `);
}
