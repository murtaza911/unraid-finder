import { useState, useEffect, useRef } from 'react';
import type { FileEntry } from '../types/index.js';
import '../styles/galleryview.css';

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
  if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return '🖼';
  if (mimeType.startsWith('video/') || ['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext)) return '🎬';
  if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'flac', 'aac', 'm4a'].includes(ext)) return '🎵';
  if (ext === 'pdf') return '📄';
  if (['zip', 'tar', 'gz', '7z', 'rar'].includes(ext)) return '📦';
  if (['js', 'ts', 'tsx', 'jsx', 'json', 'py', 'rs', 'go'].includes(ext)) return '💻';
  return '📄';
}

function isImageEntry(entry: FileEntry): boolean {
  const ext = (entry.extension || '').toLowerCase();
  const mimeType = (entry.mimeType || '').toLowerCase();
  return (
    mimeType.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)
  );
}

export function GalleryView({ entries, selectedPaths, onSelect, onOpen }: ViewProps) {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const filmstripRef = useRef<HTMLDivElement>(null);

  // Set active to first selected, or first entry
  useEffect(() => {
    if (selectedPaths.size > 0) {
      const firstSelectedPath = Array.from(selectedPaths)[0];
      const idx = entries.findIndex((e) => e.path === firstSelectedPath);
      if (idx >= 0) setActiveIndex(idx);
    } else if (entries.length > 0) {
      setActiveIndex(0);
    }
  }, [entries, selectedPaths]);

  const activeEntry = entries[activeIndex] ?? null;

  const handleThumbClick = (index: number, entry: FileEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex(index);
    onSelect(entry.path, { cmd: e.metaKey || e.ctrlKey, shift: e.shiftKey });
    // Scroll thumb into view
    const filmstrip = filmstripRef.current;
    if (filmstrip) {
      const thumb = filmstrip.children[index] as HTMLElement;
      if (thumb) thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  const handleThumbDoubleClick = (entry: FileEntry) => {
    onOpen(entry.path, entry.isDirectory);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && activeIndex > 0) {
      const newIdx = activeIndex - 1;
      setActiveIndex(newIdx);
      onSelect(entries[newIdx].path);
    } else if (e.key === 'ArrowRight' && activeIndex < entries.length - 1) {
      const newIdx = activeIndex + 1;
      setActiveIndex(newIdx);
      onSelect(entries[newIdx].path);
    } else if (e.key === 'Enter' && activeEntry) {
      onOpen(activeEntry.path, activeEntry.isDirectory);
    }
  };

  return (
    <div className="gallery-view" onKeyDown={handleKeyDown} tabIndex={0} role="region" aria-label="Gallery view">
      {/* Large Preview */}
      <div className="gallery-view__preview">
        {activeEntry ? (
          <div className="gallery-view__preview-wrap">
            {isImageEntry(activeEntry) ? (
              <img
                className="gallery-view__preview-img"
                src={`/api/files/download?path=${encodeURIComponent(activeEntry.path)}`}
                alt={activeEntry.name}
                onDoubleClick={() => onOpen(activeEntry.path, activeEntry.isDirectory)}
              />
            ) : (
              <span
                className="gallery-view__preview-icon"
                onDoubleClick={() => onOpen(activeEntry.path, activeEntry.isDirectory)}
              >
                {getFileIcon(activeEntry)}
              </span>
            )}
            <span className="gallery-view__preview-name">{activeEntry.name}</span>
          </div>
        ) : (
          <span className="gallery-view__preview-empty">No items to display</span>
        )}
      </div>

      {/* Filmstrip */}
      <div className="gallery-view__filmstrip" ref={filmstripRef}>
        {entries.map((entry, index) => {
          const isActive = index === activeIndex;
          return (
            <div
              key={entry.path}
              className={`gallery-view__thumb${isActive ? ' gallery-view__thumb--active' : ''}`}
              onClick={(e) => handleThumbClick(index, entry, e)}
              onDoubleClick={() => handleThumbDoubleClick(entry)}
              role="button"
              tabIndex={0}
              aria-label={entry.name}
              aria-pressed={isActive}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleThumbDoubleClick(entry);
              }}
            >
              {isImageEntry(entry) ? (
                <img
                  className="gallery-view__thumb-img"
                  src={`/api/files/download?path=${encodeURIComponent(entry.path)}`}
                  alt={entry.name}
                  loading="lazy"
                />
              ) : (
                <>
                  <span className="gallery-view__thumb-icon">{getFileIcon(entry)}</span>
                  <span className="gallery-view__thumb-name">{entry.name}</span>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
