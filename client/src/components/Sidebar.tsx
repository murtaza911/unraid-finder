import { useEffect, useState } from 'react';
import { useStore } from '../store/index.js';
import api from '../api/client.js';
import type { Tag } from '../types/index.js';
import '../styles/sidebar.css';

interface SidebarProps {
  onNavigate: (path: string) => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { browsePaths, setBrowsePaths, currentPath } = useStore();
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    api.get('/settings/paths')
      .then((res) => setBrowsePaths(res.data))
      .catch(() => {/* ignore */});

    api.get('/tags')
      .then((res) => setTags(res.data))
      .catch(() => {/* ignore */});
  }, [setBrowsePaths]);

  const isActive = (path: string) => currentPath === path;

  return (
    <aside className="sidebar">
      {/* Favorites */}
      <div className="sidebar__section">
        <div className="sidebar__section-header">Favorites</div>
        <div
          className={`sidebar__item${isActive('/') ? ' sidebar__item--active' : ''}`}
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
      {browsePaths.filter((p) => p.visible).length > 0 && (
        <>
          <div className="sidebar__separator" />
          <div className="sidebar__section">
            <div className="sidebar__section-header">Shares</div>
            {browsePaths
              .filter((p) => p.visible)
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((bp) => (
                <div
                  key={bp.mountPath}
                  className={`sidebar__item${isActive(bp.mountPath) ? ' sidebar__item--active' : ''}`}
                  onClick={() => onNavigate(bp.mountPath)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && onNavigate(bp.mountPath)}
                >
                  <span className="sidebar__item-icon">🗄</span>
                  <span className="sidebar__item-label">{bp.displayName}</span>
                </div>
              ))}
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
              <div
                key={tag.id}
                className="sidebar__item"
                role="button"
                tabIndex={0}
                onClick={() => {/* future: filter by tag */}}
                onKeyDown={() => {/* future: filter by tag */}}
              >
                <span
                  className="sidebar__tag-dot"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="sidebar__item-label">{tag.name}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </aside>
  );
}
