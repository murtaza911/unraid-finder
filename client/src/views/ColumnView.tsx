import { useState, useEffect, useCallback } from 'react';
import api from '../api/client.js';
import type { FileEntry, DirectoryListing } from '../types/index.js';
import '../styles/columnview.css';

interface ViewProps {
  entries: FileEntry[];
  selectedPaths: Set<string>;
  onSelect: (path: string, meta?: { cmd?: boolean; shift?: boolean }) => void;
  onOpen: (path: string, isDir: boolean) => void;
  onRename: (path: string, newName: string) => void;
  currentPath: string;
  onNavigate: (path: string) => void;
}

interface Column {
  path: string;
  entries: FileEntry[];
  selectedPath: string | null;
}

function getFileIcon(entry: FileEntry): string {
  if (entry.isDirectory) return '📁';
  const ext = (entry.extension || '').toLowerCase();
  const mimeType = (entry.mimeType || '').toLowerCase();
  if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return '🖼';
  if (mimeType.startsWith('video/') || ['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext)) return '🎬';
  if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg'].includes(ext)) return '🎵';
  if (ext === 'pdf') return '📄';
  if (['zip', 'tar', 'gz', '7z', 'rar'].includes(ext)) return '📦';
  if (['js', 'ts', 'tsx', 'jsx', 'json', 'py', 'rs', 'go'].includes(ext)) return '💻';
  return '📄';
}

export function ColumnView({ entries, selectedPaths, onSelect, onOpen, currentPath, onNavigate }: ViewProps) {
  const [columns, setColumns] = useState<Column[]>([
    { path: currentPath, entries, selectedPath: null },
  ]);

  // Sync first column entries when parent entries change
  useEffect(() => {
    setColumns((prev) => {
      if (prev.length === 0) return [{ path: currentPath, entries, selectedPath: null }];
      const updated = [...prev];
      updated[0] = { ...updated[0], path: currentPath, entries };
      // If path changed, reset to single column
      if (prev[0].path !== currentPath) {
        return [{ path: currentPath, entries, selectedPath: null }];
      }
      return updated;
    });
  }, [currentPath, entries]);

  const loadColumn = useCallback(async (colIndex: number, dirPath: string) => {
    try {
      const res = await api.get<DirectoryListing>('/files/list', { params: { path: dirPath } });
      setColumns((prev) => {
        const updated = prev.slice(0, colIndex + 1);
        updated.push({ path: dirPath, entries: res.data.entries, selectedPath: null });
        return updated;
      });
    } catch {
      // ignore
    }
  }, []);

  const handleItemClick = useCallback(
    (colIndex: number, entry: FileEntry, e: React.MouseEvent) => {
      e.stopPropagation();
      // Mark selection in this column
      setColumns((prev) => {
        const updated = [...prev];
        updated[colIndex] = { ...updated[colIndex], selectedPath: entry.path };
        // Remove columns beyond this one
        return updated.slice(0, colIndex + 1);
      });

      onSelect(entry.path, { cmd: e.metaKey || e.ctrlKey, shift: e.shiftKey });

      if (entry.isDirectory) {
        loadColumn(colIndex, entry.path);
        onNavigate(entry.path);
      }
    },
    [onSelect, onNavigate, loadColumn]
  );

  const handleItemDoubleClick = useCallback(
    (entry: FileEntry, e: React.MouseEvent) => {
      e.stopPropagation();
      onOpen(entry.path, entry.isDirectory);
    },
    [onOpen]
  );

  return (
    <div className="column-view">
      {columns.map((col, colIndex) => (
        <div key={`${colIndex}-${col.path}`} className="column-view__column">
          {col.entries.length === 0 ? (
            <div className="column-view__empty">Empty folder</div>
          ) : (
            col.entries.map((entry) => {
              const isSelected = selectedPaths.has(entry.path) || col.selectedPath === entry.path;
              return (
                <div
                  key={entry.path}
                  className={`column-view__item${isSelected ? ' column-view__item--selected' : ''}`}
                  onClick={(e) => handleItemClick(colIndex, entry, e)}
                  onDoubleClick={(e) => handleItemDoubleClick(entry, e)}
                  role="button"
                  tabIndex={0}
                  aria-selected={isSelected}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onOpen(entry.path, entry.isDirectory);
                  }}
                >
                  <span className="column-view__item-icon">{getFileIcon(entry)}</span>
                  <span className="column-view__item-name">{entry.name}</span>
                  {entry.isDirectory && (
                    <span className="column-view__item-arrow">›</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      ))}
    </div>
  );
}
