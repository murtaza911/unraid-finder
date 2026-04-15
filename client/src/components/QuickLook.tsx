import { useEffect, useState } from 'react';
import type { FileEntry } from '../types/index.js';
import '../styles/quicklook.css';

interface QuickLookProps {
  file: FileEntry;
  allFiles: FileEntry[];
  onClose: () => void;
  onNavigate: (file: FileEntry) => void;
}

const TEXT_EXTENSIONS = new Set([
  '.txt', '.md', '.json', '.js', '.ts', '.tsx', '.jsx', '.css', '.html',
  '.xml', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf', '.sh', '.bash',
  '.py', '.rb', '.go', '.rs', '.java', '.c', '.cpp', '.h', '.hpp', '.sql',
  '.env', '.log', '.csv',
]);

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

const HEIC_EXTENSIONS = new Set(['.heic', '.heif']);

function getFileType(file: FileEntry): 'text' | 'image' | 'video' | 'audio' | 'pdf' | 'other' {
  const mime = file.mimeType ?? '';
  const ext = (file.extension ?? '').toLowerCase();

  if (mime.startsWith('image/') || HEIC_EXTENSIONS.has(ext)) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime === 'application/pdf') return 'pdf';
  if (mime.startsWith('text/') || TEXT_EXTENSIONS.has(ext)) return 'text';
  return 'other';
}

function fileIcon(file: FileEntry): string {
  if (file.isDirectory) return '📁';
  const mime = file.mimeType ?? '';
  if (mime.startsWith('image/')) return '🖼';
  if (mime.startsWith('video/')) return '🎬';
  if (mime.startsWith('audio/')) return '🎵';
  if (mime === 'application/pdf') return '📄';
  if (mime.startsWith('text/')) return '📝';
  return '📄';
}

function buildMediaUrl(file: FileEntry): string {
  const token = localStorage.getItem('token') ?? '';
  const ext = (file.extension ?? '').toLowerCase();
  const preview = HEIC_EXTENSIONS.has(ext) ? '&preview=true' : '';
  return `/api/download?path=${encodeURIComponent(file.path)}&token=${encodeURIComponent(token)}${preview}`;
}

export function QuickLook({ file, allFiles, onClose, onNavigate }: QuickLookProps) {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [textLoading, setTextLoading] = useState(false);

  const fileType = getFileType(file);
  const currentIndex = allFiles.findIndex((f) => f.path === file.path);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allFiles.length - 1;

  useEffect(() => {
    if (fileType !== 'text') {
      setTextContent(null);
      return;
    }
    setTextLoading(true);
    setTextContent(null);
    const token = localStorage.getItem('token') ?? '';
    fetch(`/api/download?path=${encodeURIComponent(file.path)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.text())
      .then((text) => setTextContent(text))
      .catch(() => setTextContent('(Unable to load file content)'))
      .finally(() => setTextLoading(false));
  }, [file.path, fileType]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowLeft' && hasPrev) {
        onNavigate(allFiles[currentIndex - 1]);
      } else if (e.key === 'ArrowRight' && hasNext) {
        onNavigate(allFiles[currentIndex + 1]);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, onNavigate, allFiles, currentIndex, hasPrev, hasNext]);

  const mediaUrl = buildMediaUrl(file);

  const renderContent = () => {
    switch (fileType) {
      case 'text':
        return (
          <pre>
            {textLoading ? 'Loading...' : (textContent ?? '')}
          </pre>
        );
      case 'image':
        return <img src={mediaUrl} alt={file.name} />;
      case 'video':
        return <video src={mediaUrl} controls autoPlay />;
      case 'audio':
        return <audio src={mediaUrl} controls autoPlay />;
      case 'pdf':
        return (
          <iframe
            src={mediaUrl}
            title={file.name}
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        );
      default:
        return (
          <div className="quicklook__info">
            <div className="quicklook__info-icon">{fileIcon(file)}</div>
            <div className="quicklook__info-name">{file.name}</div>
            <div className="quicklook__info-meta">{formatSize(file.size)}</div>
          </div>
        );
    }
  };

  return (
    <div className="quicklook">
      <div className="quicklook__backdrop" onClick={onClose} />
      <div className="quicklook__panel">
        <div className="quicklook__header">
          <span>{file.name}</span>
          <button className="quicklook__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="quicklook__content">
          {renderContent()}
        </div>
        {hasPrev && (
          <button
            className="quicklook__nav quicklook__nav--prev"
            onClick={() => onNavigate(allFiles[currentIndex - 1])}
            aria-label="Previous"
          >
            ‹
          </button>
        )}
        {hasNext && (
          <button
            className="quicklook__nav quicklook__nav--next"
            onClick={() => onNavigate(allFiles[currentIndex + 1])}
            aria-label="Next"
          >
            ›
          </button>
        )}
      </div>
    </div>
  );
}
