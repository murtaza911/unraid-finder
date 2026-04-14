import type { FileEntry } from '../types/index.js';
import '../styles/iconview.css';

interface ViewProps {
  entries: FileEntry[];
  selectedPaths: Set<string>;
  onSelect: (path: string, meta?: { cmd?: boolean; shift?: boolean }) => void;
  onOpen: (path: string, isDir: boolean) => void;
  onRename: (path: string, newName: string) => void;
}

function getFileIcon(entry: FileEntry): string {
  if (entry.isDirectory) return '📁';
  const ext = (entry.extension || '').toLowerCase();
  const mimeType = (entry.mimeType || '').toLowerCase();

  if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff'].includes(ext)) return '🖼';
  if (mimeType.startsWith('video/') || ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'm4v', 'webm'].includes(ext)) return '🎬';
  if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg', 'opus'].includes(ext)) return '🎵';
  if (['pdf'].includes(ext)) return '📄';
  if (['doc', 'docx', 'odt', 'rtf'].includes(ext)) return '📝';
  if (['xls', 'xlsx', 'ods', 'csv'].includes(ext)) return '📊';
  if (['ppt', 'pptx', 'odp'].includes(ext)) return '📊';
  if (['zip', 'tar', 'gz', 'bz2', 'xz', '7z', 'rar'].includes(ext)) return '📦';
  if (['js', 'ts', 'jsx', 'tsx', 'json', 'html', 'css', 'py', 'rs', 'go', 'java', 'c', 'cpp', 'sh', 'rb', 'php'].includes(ext)) return '💻';
  if (['txt', 'md', 'log', 'yaml', 'yml', 'xml', 'toml', 'ini', 'conf'].includes(ext)) return '📃';
  return '📄';
}

export function IconView({ entries, selectedPaths, onSelect, onOpen }: ViewProps) {
  return (
    <div
      className="icon-view"
      onClick={() => onSelect('', {})}
    >
      {entries.map((entry) => {
        const isSelected = selectedPaths.has(entry.path);
        return (
          <div
            key={entry.path}
            className={`icon-view__item${isSelected ? ' icon-view__item--selected' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(entry.path, { cmd: e.metaKey || e.ctrlKey, shift: e.shiftKey });
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onOpen(entry.path, entry.isDirectory);
            }}
            role="button"
            tabIndex={0}
            aria-label={entry.name}
            aria-selected={isSelected}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onOpen(entry.path, entry.isDirectory);
              if (e.key === ' ') onSelect(entry.path, { cmd: e.metaKey || e.ctrlKey });
            }}
          >
            <span className="icon-view__icon">{getFileIcon(entry)}</span>
            <span className="icon-view__name">{entry.name}</span>
          </div>
        );
      })}
    </div>
  );
}
