import { useStore } from '../store/index.js';
import type { FileEntry, SortField } from '../types/index.js';
import '../styles/listview.css';

interface ViewProps {
  entries: FileEntry[];
  selectedPaths: Set<string>;
  onSelect: (path: string, meta?: { cmd?: boolean; shift?: boolean }) => void;
  onOpen: (path: string, isDir: boolean) => void;
  onRename: (path: string, newName: string) => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val % 1 === 0 ? val : val.toFixed(1)} ${units[i]}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getFileIcon(entry: FileEntry): string {
  if (entry.isDirectory) return '📁';
  const ext = (entry.extension || '').toLowerCase();
  const mimeType = (entry.mimeType || '').toLowerCase();
  if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return '🖼';
  if (mimeType.startsWith('video/') || ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'webm'].includes(ext)) return '🎬';
  if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg'].includes(ext)) return '🎵';
  if (ext === 'pdf') return '📄';
  if (['zip', 'tar', 'gz', 'bz2', 'xz', '7z', 'rar'].includes(ext)) return '📦';
  if (['js', 'ts', 'jsx', 'tsx', 'json', 'html', 'css', 'py', 'rs', 'go'].includes(ext)) return '💻';
  if (['txt', 'md', 'log'].includes(ext)) return '📃';
  return '📄';
}

function getKindLabel(entry: FileEntry): string {
  if (entry.isDirectory) return 'Folder';
  const ext = entry.extension ? entry.extension.toUpperCase() : '';
  if (ext) return `${ext} File`;
  return 'File';
}

const SORT_COLUMNS: { field: SortField; label: string; cellClass: string; headerClass: string }[] = [
  { field: 'name', label: 'Name', cellClass: '', headerClass: 'list-view__header-cell--name' },
  { field: 'size', label: 'Size', cellClass: 'list-view__cell--size', headerClass: 'list-view__header-cell--size' },
  { field: 'modifiedAt', label: 'Date Modified', cellClass: 'list-view__cell--date', headerClass: 'list-view__header-cell--date' },
  { field: 'kind', label: 'Kind', cellClass: 'list-view__cell--kind', headerClass: 'list-view__header-cell--kind' },
];

export function ListView({ entries, selectedPaths, onSelect, onOpen }: ViewProps) {
  const { sortField, setSortField, sortDirection, setSortDirection } = useStore();

  const handleHeaderClick = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="list-view">
      <table className="list-view__table">
        <thead className="list-view__header">
          <tr>
            {SORT_COLUMNS.map(({ field, label, headerClass }) => (
              <th
                key={field}
                className={`list-view__header-cell ${headerClass}${sortField === field ? ' list-view__header-cell--active' : ''}`}
                onClick={() => handleHeaderClick(field)}
                aria-sort={sortField === field ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                {label}
                {sortField === field && (
                  <span className="list-view__sort-arrow">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="list-view__body">
          {entries.map((entry) => {
            const isSelected = selectedPaths.has(entry.path);
            return (
              <tr
                key={entry.path}
                className={isSelected ? 'list-view__row--selected' : ''}
                onClick={(e) => onSelect(entry.path, { cmd: e.metaKey || e.ctrlKey, shift: e.shiftKey })}
                onDoubleClick={() => onOpen(entry.path, entry.isDirectory)}
                aria-selected={isSelected}
                role="row"
              >
                <td className="list-view__cell">
                  <div className="list-view__file-name">
                    <span className="list-view__file-icon">{getFileIcon(entry)}</span>
                    <span>{entry.name}</span>
                  </div>
                </td>
                <td className="list-view__cell list-view__cell--size">
                  {entry.isDirectory ? '—' : formatBytes(entry.size)}
                </td>
                <td className="list-view__cell list-view__cell--date">
                  {formatDate(entry.modifiedAt)}
                </td>
                <td className="list-view__cell list-view__cell--kind">
                  {getKindLabel(entry)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
