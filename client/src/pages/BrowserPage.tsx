import { useState, useRef, useEffect, useCallback } from 'react';
import { useFileSystem } from '../hooks/useFileSystem.js';
import { useSelection } from '../hooks/useSelection.js';
import { useClipboard } from '../hooks/useClipboard.js';
import { useKeyboard } from '../hooks/useKeyboard.js';
import { useDragDrop } from '../hooks/useDragDrop.js';
import { useStore } from '../store/index.js';
import { TitleBar } from '../components/TitleBar.js';
import { Toolbar } from '../components/Toolbar.js';
import { Sidebar } from '../components/Sidebar.js';
import { StatusBar } from '../components/StatusBar.js';
import { ContextMenu } from '../components/ContextMenu.js';
import { QuickLook } from '../components/QuickLook.js';
import { DownloadPrompt } from '../components/DownloadPrompt.js';
import { IconView } from '../views/IconView.js';
import { ListView } from '../views/ListView.js';
import { ColumnView } from '../views/ColumnView.js';
import { GalleryView } from '../views/GalleryView.js';
import api from '../api/client.js';
import type { FileEntry } from '../types/index.js';

export function BrowserPage() {
  const {
    entries, currentPath, navigateTo, refresh,
    createFolder, renameFile, deleteFiles, copyFiles, moveFiles,
  } = useFileSystem();
  const { selectedPaths, selectedEntries, select, selectAll, clearSelection } = useSelection(entries);
  const { clipboard, copy, cut, clear: clearClipboard } = useClipboard();
  const { viewMode, sidebarOpen } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [diskFree, setDiskFree] = useState<number | undefined>();
  const uploadRef = useRef<HTMLInputElement>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  // Quick Look state
  const [quickLookFile, setQuickLookFile] = useState<FileEntry | null>(null);

  // Download prompt state
  const [downloadPrompt, setDownloadPrompt] = useState<FileEntry[] | null>(null);

  const folderName = currentPath === '/' ? 'Finder' : currentPath.split('/').filter(Boolean).pop() ?? 'Finder';

  const filteredEntries = searchQuery.trim()
    ? entries.filter((e) => e.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : entries;

  // Fetch disk usage
  useEffect(() => {
    api.get<{ free: number }>('/files/disk')
      .then((res) => setDiskFree(res.data.free))
      .catch(() => {});
  }, [currentPath]);

  // Drag and drop upload
  const { isDragging } = useDragDrop(currentPath, refresh);

  // Upload via button
  const handleUploadClick = useCallback(() => {
    uploadRef.current?.click();
  }, []);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const formData = new FormData();
    formData.append('path', currentPath);
    for (const file of Array.from(files)) {
      formData.append('files', file);
    }
    try {
      await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      refresh();
    } catch (err) {
      console.error('Upload failed:', err);
    }
    if (uploadRef.current) uploadRef.current.value = '';
  }, [currentPath, refresh]);

  // Open file or folder
  const handleOpen = useCallback((path: string, isDir: boolean) => {
    if (isDir) {
      navigateTo(path);
      clearSelection();
    } else {
      const file = entries.find((e) => e.path === path);
      if (file) setQuickLookFile(file);
    }
  }, [navigateTo, clearSelection, entries]);

  // Context menu handler
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  // Paste handler
  const handlePaste = useCallback(async () => {
    if (!clipboard.operation || clipboard.files.length === 0) return;
    const paths = clipboard.files.map((f) => f.path);
    if (clipboard.operation === 'copy') {
      await copyFiles(paths, currentPath);
    } else {
      await moveFiles(paths, currentPath);
      clearClipboard();
    }
    refresh();
  }, [clipboard, copyFiles, moveFiles, currentPath, clearClipboard, refresh]);

  // Delete handler
  const handleDelete = useCallback(async () => {
    if (selectedEntries.length === 0) return;
    const confirmed = window.confirm(`Delete ${selectedEntries.length} item${selectedEntries.length > 1 ? 's' : ''}?`);
    if (!confirmed) return;
    await deleteFiles(selectedEntries.map((e) => e.path));
    clearSelection();
  }, [selectedEntries, deleteFiles, clearSelection]);

  // Download handler
  const handleDownload = useCallback(() => {
    if (selectedEntries.length === 0) return;
    if (selectedEntries.length === 1) {
      const token = localStorage.getItem('token') ?? '';
      window.open(`/api/download?path=${encodeURIComponent(selectedEntries[0].path)}&token=${encodeURIComponent(token)}`);
    } else {
      setDownloadPrompt(selectedEntries);
    }
  }, [selectedEntries]);

  const handleDownloadIndividual = useCallback(() => {
    if (!downloadPrompt) return;
    const token = localStorage.getItem('token') ?? '';
    for (const file of downloadPrompt) {
      window.open(`/api/download?path=${encodeURIComponent(file.path)}&token=${encodeURIComponent(token)}`);
    }
    setDownloadPrompt(null);
  }, [downloadPrompt]);

  const handleDownloadZip = useCallback(async () => {
    if (!downloadPrompt) return;
    const paths = downloadPrompt.map((f) => f.path);
    try {
      const res = await api.post('/download/zip', { paths }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'download.zip';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Zip download failed:', err);
    }
    setDownloadPrompt(null);
  }, [downloadPrompt]);

  // Compress handler
  const handleCompress = useCallback(async () => {
    if (selectedEntries.length === 0) return;
    const paths = selectedEntries.map((e) => e.path);
    const zipName = selectedEntries.length === 1
      ? selectedEntries[0].name.replace(/\.[^.]*$/, '') + '.zip'
      : 'archive.zip';
    const zipPath = currentPath === '/' ? `/${zipName}` : `${currentPath}/${zipName}`;
    try {
      await api.post('/download/zip', { paths, saveTo: zipPath });
      refresh();
    } catch {
      // Fallback: just download as zip
      handleDownload();
    }
  }, [selectedEntries, currentPath, refresh, handleDownload]);

  // New folder handler
  const handleNewFolder = useCallback(async () => {
    const name = window.prompt('New folder name:');
    if (!name) return;
    await createFolder(name);
  }, [createFolder]);

  // Quick Look toggle
  const toggleQuickLook = useCallback(() => {
    if (quickLookFile) {
      setQuickLookFile(null);
    } else if (selectedEntries.length === 1) {
      setQuickLookFile(selectedEntries[0]);
    }
  }, [quickLookFile, selectedEntries]);

  // Keyboard shortcuts
  useKeyboard({
    onCopy: () => { if (selectedEntries.length > 0) copy(selectedEntries, currentPath); },
    onCut: () => { if (selectedEntries.length > 0) cut(selectedEntries, currentPath); },
    onPaste: handlePaste,
    onSelectAll: selectAll,
    onDelete: handleDelete,
    onRename: () => {
      if (selectedEntries.length === 1) {
        const newName = window.prompt('Rename to:', selectedEntries[0].name);
        if (newName && newName !== selectedEntries[0].name) renameFile(selectedEntries[0].path, newName);
      }
    },
    onQuickLook: toggleQuickLook,
    onEscape: () => { setQuickLookFile(null); setContextMenu(null); clearSelection(); },
  }, !quickLookFile); // Disable when Quick Look is open (it has its own key handler)

  const viewProps = {
    entries: filteredEntries,
    selectedPaths,
    onSelect: select,
    onOpen: handleOpen,
    onRename: (path: string, newName: string) => {
      renameFile(path, newName);
    },
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
          style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', position: 'relative' }}
          onClick={(e) => { if (e.target === e.currentTarget) clearSelection(); }}
          onContextMenu={handleContextMenu}
        >
          {viewMode === 'icon' && <IconView {...viewProps} />}
          {viewMode === 'list' && <ListView {...viewProps} />}
          {viewMode === 'column' && (
            <ColumnView {...viewProps} currentPath={currentPath} onNavigate={navigateTo} />
          )}
          {viewMode === 'gallery' && <GalleryView {...viewProps} />}

          {/* Drag and drop overlay */}
          {isDragging && (
            <div style={{
              position: 'absolute', inset: 0, background: 'var(--accent-bg)',
              border: '3px dashed var(--accent)', borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, color: 'var(--accent)', zIndex: 500, pointerEvents: 'none',
            }}>
              Drop files here to upload
            </div>
          )}
        </main>
      </div>

      <StatusBar
        totalItems={filteredEntries.length}
        selectedCount={selectedPaths.size}
        diskFree={diskFree}
      />

      {/* Hidden file input for upload button */}
      <input ref={uploadRef} type="file" multiple style={{ display: 'none' }} onChange={handleFileUpload} />

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          entries={selectedEntries}
          onClose={() => setContextMenu(null)}
          onQuickLook={() => { if (selectedEntries.length > 0) setQuickLookFile(selectedEntries[0]); }}
          onGetInfo={() => { if (selectedEntries.length > 0) setQuickLookFile(selectedEntries[0]); }}
          onRename={() => {
            if (selectedEntries.length === 1) {
              const newName = window.prompt('Rename to:', selectedEntries[0].name);
              if (newName && newName !== selectedEntries[0].name) renameFile(selectedEntries[0].path, newName);
            }
          }}
          onCopy={() => copy(selectedEntries, currentPath)}
          onCut={() => cut(selectedEntries, currentPath)}
          onPaste={handlePaste}
          onDelete={handleDelete}
          onCompress={handleCompress}
          onExtract={() => {/* TODO */}}
          onDownload={handleDownload}
          onNewFolder={handleNewFolder}
          canPaste={clipboard.operation !== null}
          hasArchive={selectedEntries.some((e) => e.extension === '.zip')}
        />
      )}

      {/* Quick Look */}
      {quickLookFile && (
        <QuickLook
          file={quickLookFile}
          allFiles={filteredEntries.filter((e) => !e.isDirectory)}
          onClose={() => setQuickLookFile(null)}
          onNavigate={(file) => setQuickLookFile(file)}
        />
      )}

      {/* Download Prompt */}
      {downloadPrompt && (
        <DownloadPrompt
          fileCount={downloadPrompt.length}
          onIndividual={handleDownloadIndividual}
          onZip={handleDownloadZip}
          onCancel={() => setDownloadPrompt(null)}
        />
      )}
    </div>
  );
}
