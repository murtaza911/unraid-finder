export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modifiedAt: string;
  createdAt: string;
  mimeType: string | null;
  extension: string | null;
}

export interface DirectoryListing {
  path: string;
  entries: FileEntry[];
  totalItems: number;
}

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'full' | 'readonly';
  allowedPaths: string[];
  createdAt: string;
}

export interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  role: 'admin' | 'full' | 'readonly';
  allowed_paths: string;
  created_at: string;
}

export interface BrowsePath {
  mountPath: string;
  displayName: string;
  visible: boolean;
  sortOrder: number;
}

export interface AppSettings {
  deleteMode: 'trash' | 'permanent';
  multiDownloadDefault: 'ask' | 'zip' | 'individual';
  sessionDurationDays: number;
  indexIntervalMinutes: number;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
}

export interface FileTag {
  filePath: string;
  tagId: number;
}

export interface IndexEntry {
  path: string;
  name: string;
  is_directory: boolean;
  size: number;
  modified_at: string;
  file_type: string | null;
  parent_dir: string;
}

export interface SearchResult {
  path: string;
  name: string;
  isDirectory: boolean;
  size: number;
  modifiedAt: string;
  parentDir: string;
}
