import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/index.js';
import type { ViewMode, SortField } from '../types/index.js';
import '../styles/toolbar.css';

interface ToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onUploadClick: () => void;
}

const VIEW_BUTTONS: { mode: ViewMode; icon: string; label: string }[] = [
  { mode: 'icon', icon: '⊞', label: 'Icon View' },
  { mode: 'list', icon: '☰', label: 'List View' },
  { mode: 'column', icon: '⫸', label: 'Column View' },
  { mode: 'gallery', icon: '▦', label: 'Gallery View' },
];

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'size', label: 'Size' },
  { value: 'modifiedAt', label: 'Date Modified' },
  { value: 'kind', label: 'Kind' },
];

export function Toolbar({ searchQuery, onSearchChange, onUploadClick }: ToolbarProps) {
  const navigate = useNavigate();
  const {
    viewMode,
    setViewMode,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    goBack,
    goForward,
    canGoBack,
    canGoForward,
  } = useStore();

  const toggleSortDir = () => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');

  return (
    <div className="toolbar">
      {/* Navigation */}
      <div className="toolbar__nav-group">
        <button
          className="toolbar__nav-btn"
          onClick={goBack}
          disabled={!canGoBack()}
          title="Go Back"
          aria-label="Go Back"
        >
          ‹
        </button>
        <button
          className="toolbar__nav-btn"
          onClick={goForward}
          disabled={!canGoForward()}
          title="Go Forward"
          aria-label="Go Forward"
        >
          ›
        </button>
      </div>

      <div className="toolbar__divider" />

      {/* View Switcher */}
      <div className="toolbar__view-group" role="group" aria-label="View mode">
        {VIEW_BUTTONS.map(({ mode, icon, label }) => (
          <button
            key={mode}
            className={`toolbar__view-btn${viewMode === mode ? ' toolbar__view-btn--active' : ''}`}
            onClick={() => setViewMode(mode)}
            title={label}
            aria-label={label}
            aria-pressed={viewMode === mode}
          >
            {icon}
          </button>
        ))}
      </div>

      <div className="toolbar__divider" />

      {/* Sort Controls */}
      <div className="toolbar__sort-group">
        <span className="toolbar__sort-label">Sort:</span>
        <select
          className="toolbar__sort-select"
          value={sortField}
          onChange={(e) => setSortField(e.target.value as SortField)}
          aria-label="Sort by"
        >
          {SORT_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <button
          className="toolbar__sort-dir-btn"
          onClick={toggleSortDir}
          title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
          aria-label={`Sort ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}
        >
          {sortDirection === 'asc' ? '↑' : '↓'}
        </button>
      </div>

      <div className="toolbar__spacer" />

      {/* Search */}
      <div className="toolbar__search-wrap">
        <span className="toolbar__search-icon">🔍</span>
        <input
          type="search"
          className="toolbar__search"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search files"
        />
      </div>

      {/* Upload */}
      <button className="toolbar__upload-btn" onClick={onUploadClick} aria-label="Upload files">
        ↑ Upload
      </button>

      {/* Settings */}
      <button
        className="toolbar__nav-btn"
        onClick={() => navigate('/settings')}
        title="Settings"
        aria-label="Settings"
        style={{ fontSize: 16 }}
      >
        ⚙
      </button>
    </div>
  );
}
