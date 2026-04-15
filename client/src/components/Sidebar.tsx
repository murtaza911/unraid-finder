import { useEffect, useState } from 'react';
import { useStore } from '../store/index.js';
import api from '../api/client.js';
import type { BrowsePath, Tag } from '../types/index.js';
import '../styles/sidebar.css';

interface SidebarProps {
  onNavigate: (path: string) => void;
}

/** Convert a mount path like "/browse/MyMedia" to a relative path like "/MyMedia" */
function toRelativePath(bp: BrowsePath): string {
  // The mount path is the full container path, e.g. "/browse/data"
  // We need just the last segment as a relative path: "/data"
  const name = bp.mountPath.split('/').pop() || bp.mountPath;
  return '/' + name;
}

/** Get display name — use the saved displayName, or fall back to the directory name */
function getDisplayName(bp: BrowsePath): string {
  const dirName = bp.mountPath.split('/').pop() || bp.mountPath;
  // If displayName matches the full mount path or a generic placeholder, use the dir name
  if (!bp.displayName || bp.displayName === bp.mountPath) {
    return dirName;
  }
  return bp.displayName;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { browsePaths, setBrowsePaths, currentPath } = useStore();
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    api.get('/settings/paths')
      .then((res) => setBrowsePaths(res.data))
      .catch(() => {});

    api.get('/tags')
      .then((res) => setTags(res.data))
      .catch(() => {});
  }, [setBrowsePaths]);

  const visiblePaths = browsePaths
    .filter((p) => p.visible)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <aside className="sidebar">
      {/* Favorites */}
      <div className="sidebar__section">
        <div className="sidebar__section-header">Favorites</div>
        <div
          className={`sidebar__item${currentPath === '/' ? ' sidebar__item--active' : ''}`}
          onClick={() => onNavigate('/')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onNavigate('/')}
        >
          <span className="sidebar__item-icon">🏠</span>
          <span className="sidebar__item-label">Home</span>
        </div>
      </div>

      {/* Shares */}
      {visiblePaths.length > 0 && (
        <>
          <div className="sidebar__separator" />
          <div className="sidebar__section">
            <div className="sidebar__section-header">Shares</div>
            {visiblePaths.map((bp) => {
              const relativePath = toRelativePath(bp);
              const displayName = getDisplayName(bp);
              const isActive = currentPath === relativePath || currentPath.startsWith(relativePath + '/');
              return (
                <div
                  key={bp.mountPath}
                  className={`sidebar__item${isActive ? ' sidebar__item--active' : ''}`}
                  onClick={() => onNavigate(relativePath)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && onNavigate(relativePath)}
                >
                  <span className="sidebar__item-icon">📁</span>
                  <span className="sidebar__item-label">{displayName}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <>
          <div className="sidebar__separator" />
          <div className="sidebar__section">
            <div className="sidebar__section-header">Tags</div>
            {tags.map((tag) => (
              <div key={tag.id} className="sidebar__item" role="button" tabIndex={0}>
                <span className="sidebar__tag-dot" style={{ backgroundColor: tag.color }} />
                <span className="sidebar__item-label">{tag.name}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </aside>
  );
}
