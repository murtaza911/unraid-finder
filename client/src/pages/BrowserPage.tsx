import { useState, useRef, useEffect, useCallback } from 'react';
import { useFileSystem } from '../hooks/useFileSystem.js';
import { useSelection } from '../hooks/useSelection.js';
import { useStore } from '../store/index.js';
import { TitleBar } from '../components/TitleBar.js';
import { Toolbar } from '../components/Toolbar.js';
import { Sidebar } from '../components/Sidebar.js';
import { StatusBar } from '../components/StatusBar.js';
import { IconView } from '../views/IconView.js';
import { ListView } from '../views/ListView.js';
import { ColumnView } from '../views/ColumnView.js';
import { GalleryView } from '../views/GalleryView.js';
import api from '../api/client.js';

interface DiskInfo {
  free: number;
  total: number;
  used: number;
}

export function BrowserPage() {
  const { entries, currentPath, navigateTo, renameFile } = useFileSystem();
  const { selectedPaths, select, clearSelection } = useSelection(entries);
  const { viewMode, sidebarOpen } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [diskFree, setDiskFree] = useState<number | undefined>(undefined);
  const uploadRef = useRef<HTMLInputElement>(null);

  // Derive folder name from path
  const folderName = currentPath === '/' ? 'Finder' : currentPath.split('/').filter(Boolean).pop() ?? 'Finder';

  // Filtered entries based on search query
  const filteredEntries = searchQuery.trim()
    ? entries.filter((e) =>
        e.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : entries;

  // Fetch disk usage on mount and when path changes
  useEffect(() => {
    api.get<DiskInfo>('/files/disk', { params: { path: currentPath } })
      .then((res) => setDiskFree(res.data.free))
      .catch(() => setDiskFree(undefined));
  }, [currentPath]);

  const handleUploadClick = useCallback(() => {
    uploadRef.current?.click();
  }, []);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append('files', file));
      formData.append('path', currentPath);

      try {
        await api.post('/files/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } catch {
        // silently ignore for now
      } finally {
        // Reset input so the same file can be re-uploaded
        if (uploadRef.current) uploadRef.current.value = '';
      }
    },
    [currentPath]
  );

  const handleOpen = useCallback(
    (path: string, isDir: boolean) => {
      if (isDir) {
        navigateTo(path);
        clearSelection();
      }
      // For files: could trigger download/preview — left for a future task
    },
    [navigateTo, clearSelection]
  );

  const handleRename = useCallback(
    (path: string, newName: string) => {
      renameFile(path, newName).catch(() => {/* ignore */});
    },
    [renameFile]
  );

  const viewProps = {
    entries: filteredEntries,
    selectedPaths,
    onSelect: select,
    onOpen: handleOpen,
    onRename: handleRename,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TitleBar title={folderName} />
      <Toolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onUploadClick={handleUploadClick}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {sidebarOpen && <Sidebar onNavigate={navigateTo} />}

        <main
          style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}
          onClick={() => clearSelection()}
        >
          {viewMode === 'icon' && <IconView {...viewProps} />}
          {viewMode === 'list' && <ListView {...viewProps} />}
          {viewMode === 'column' && (
            <ColumnView
              {...viewProps}
              currentPath={currentPath}
              onNavigate={navigateTo}
            />
          )}
          {viewMode === 'gallery' && <GalleryView {...viewProps} />}
        </main>
      </div>

      <StatusBar
        totalItems={filteredEntries.length}
        selectedCount={selectedPaths.size}
        diskFree={diskFree}
      />

      <input
        ref={uploadRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />
    </div>
  );
}
