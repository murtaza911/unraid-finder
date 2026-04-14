import '../styles/statusbar.css';

interface StatusBarProps {
  totalItems: number;
  selectedCount: number;
  diskFree?: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val % 1 === 0 ? val : val.toFixed(1)} ${units[i]}`;
}

export function StatusBar({ totalItems, selectedCount, diskFree }: StatusBarProps) {
  return (
    <div className="statusbar">
      <span className="statusbar__item">
        {totalItems} {totalItems === 1 ? 'item' : 'items'}
      </span>

      {selectedCount > 0 && (
        <>
          <span className="statusbar__separator" />
          <span className="statusbar__item statusbar__item--bold">
            {selectedCount} selected
          </span>
        </>
      )}

      <span className="statusbar__spacer" />

      {diskFree !== undefined && (
        <span className="statusbar__item">
          {formatBytes(diskFree)} available
        </span>
      )}
    </div>
  );
}
