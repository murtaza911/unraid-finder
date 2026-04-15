import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/index.js';
import api from '../api/client.js';
import type { DirectoryListing, FileEntry, SortField, SortDirection } from '../types/index.js';

function sortEntries(entries: FileEntry[], field: SortField, direction: SortDirection): FileEntry[] {
  return [...entries].sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    let cmp = 0;
    switch (field) {
      case 'name': cmp = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }); break;
      case 'size': cmp = a.size - b.size; break;
      case 'modifiedAt': cmp = new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime(); break;
      case 'kind': cmp = (a.extension || '').localeCompare(b.extension || ''); break;
    }
    return direction === 'asc' ? cmp : -cmp;
  });
}

export function useFileSystem() {
  const { currentPath, setCurrentPath, setEntries, setLoading, sortField, sortDirection, entries } = useStore();
  const pollingRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const fetchDirectory = useCallback(async (path: string) => {
    setLoading(true);
    try {
      const res = await api.get<DirectoryListing>('/files/list', { params: { path } });
      setEntries(sortEntries(res.data.entries, sortField, sortDirection));
    } catch { setEntries([]); }
    finally { setLoading(false); }
  }, [setEntries, setLoading, sortField, sortDirection]);

  useEffect(() => { fetchDirectory(currentPath); }, [currentPath, fetchDirectory]);
  useEffect(() => {
    pollingRef.current = setInterval(() => fetchDirectory(currentPath), 5000);
    return () => clearInterval(pollingRef.current);
  }, [currentPath, fetchDirectory]);

  const navigateTo = useCallback((path: string) => setCurrentPath(path), [setCurrentPath]);
  const refresh = useCallback(() => fetchDirectory(currentPath), [currentPath, fetchDirectory]);
  const createFolder = useCallback(async (name: string) => {
    const folderPath = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`;
    await api.post('/files/mkdir', { path: folderPath }); refresh();
  }, [currentPath, refresh]);
  const renameFile = useCallback(async (path: string, newName: string) => { await api.post('/files/rename', { path, newName }); refresh(); }, [refresh]);
  const deleteFiles = useCallback(async (paths: string[]) => { for (const p of paths) await api.delete('/files', { data: { path: p } }); refresh(); }, [refresh]);
  const copyFiles = useCallback(async (sources: string[], destDir: string) => { for (const source of sources) { const name = source.split('/').pop(); const destination = destDir === '/' ? `/${name}` : `${destDir}/${name}`; await api.post('/files/copy', { source, destination }); } refresh(); }, [refresh]);
  const moveFiles = useCallback(async (sources: string[], destDir: string) => { for (const source of sources) { const name = source.split('/').pop(); const destination = destDir === '/' ? `/${name}` : `${destDir}/${name}`; await api.post('/files/move', { source, destination }); } refresh(); }, [refresh]);

  return { entries, currentPath, navigateTo, refresh, createFolder, renameFile, deleteFiles, copyFiles, moveFiles };
}
