import { useEffect } from 'react';
import type { FileEntry } from '../types/index.js';
import '../styles/contextmenu.css';

interface ContextMenuProps {
  x: number;
  y: number;
  entries: FileEntry[];
  onClose: () => void;
  onQuickLook: () => void;
  onGetInfo: () => void;
  onRename: () => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onDelete: () => void;
  onCompress: () => void;
  onExtract: () => void;
  onDownload: () => void;
  onNewFolder: () => void;
  canPaste: boolean;
  hasArchive: boolean;
}

export function ContextMenu({
  x, y, entries, onClose,
  onQuickLook, onGetInfo, onRename,
  onCopy, onCut, onPaste,
  onDelete, onCompress, onExtract,
  onDownload, onNewFolder,
  canPaste, hasArchive,
}: ContextMenuProps) {
  useEffect(() => {
    const handler = () => onClose();
    window.addEventListener('click', handler);
    window.addEventListener('contextmenu', handler);
    return () => {
      window.removeEventListener('click', handler);
      window.removeEventListener('contextmenu', handler);
    };
  }, [onClose]);

  const hasEntries = entries.length > 0;

  const item = (
    label: string,
    action: () => void,
    shortcut?: string,
    danger?: boolean,
  ) => (
    <div
      className={`contextmenu__item${danger ? ' contextmenu__item--danger' : ''}`}
      onClick={(e) => { e.stopPropagation(); action(); onClose(); }}
      role="menuitem"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') { action(); onClose(); } }}
    >
      <span>{label}</span>
      {shortcut && <span className="contextmenu__shortcut">{shortcut}</span>}
    </div>
  );

  const separator = () => <div className="contextmenu__separator" />;

  return (
    <div
      className="contextmenu"
      style={{ left: x, top: y }}
      role="menu"
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.stopPropagation()}
    >
      {hasEntries ? (
        <>
          {item('Quick Look', onQuickLook, '␣')}
          {item('Get Info', onGetInfo)}
          {separator()}
          {item('Copy', onCopy, '⌘C')}
          {item('Cut', onCut, '⌘X')}
          {canPaste && item('Paste', onPaste, '⌘V')}
          {separator()}
          {entries.length === 1 && item('Rename', onRename, 'Enter')}
          {item('Compress', onCompress)}
          {hasArchive && item('Extract', onExtract)}
          {item('Download', onDownload)}
          {separator()}
          {item('Delete', onDelete, '⌫', true)}
        </>
      ) : (
        <>
          {item('New Folder', onNewFolder)}
          {canPaste && item('Paste', onPaste, '⌘V')}
        </>
      )}
    </div>
  );
}
