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

export type ViewMode = 'icon' | 'list' | 'column' | 'gallery';
export type SortField = 'name' | 'size' | 'modifiedAt' | 'kind';
export type SortDirection = 'asc' | 'desc';
export type ThemeMode = 'light' | 'dark';

export interface ClipboardState {
  operation: 'copy' | 'cut' | null;
  files: FileEntry[];
  sourcePath: string;
}

export interface SearchResult {
  path: string;
  name: string;
  isDirectory: boolean;
  size: number;
  modifiedAt: string;
  parentDir: string;
}
