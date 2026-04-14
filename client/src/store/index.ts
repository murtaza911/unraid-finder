import { create } from 'zustand';
import type { FileEntry, ViewMode, SortField, SortDirection, BrowsePath } from '../types/index.js';

interface AppState {
  currentPath: string;
  history: string[];
  historyIndex: number;
  setCurrentPath: (path: string) => void;
  goBack: () => void;
  goForward: () => void;
  canGoBack: () => boolean;
  canGoForward: () => boolean;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  setSortField: (field: SortField) => void;
  setSortDirection: (direction: SortDirection) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  browsePaths: BrowsePath[];
  setBrowsePaths: (paths: BrowsePath[]) => void;
  entries: FileEntry[];
  setEntries: (entries: FileEntry[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useStore = create<AppState>((set, get) => ({
  currentPath: '/',
  history: ['/'],
  historyIndex: 0,
  setCurrentPath: (path) => {
    const { history, historyIndex } = get();
    const newHistory = [...history.slice(0, historyIndex + 1), path];
    set({ currentPath: path, history: newHistory, historyIndex: newHistory.length - 1 });
  },
  goBack: () => { const { history, historyIndex } = get(); if (historyIndex > 0) set({ historyIndex: historyIndex - 1, currentPath: history[historyIndex - 1] }); },
  goForward: () => { const { history, historyIndex } = get(); if (historyIndex < history.length - 1) set({ historyIndex: historyIndex + 1, currentPath: history[historyIndex + 1] }); },
  canGoBack: () => get().historyIndex > 0,
  canGoForward: () => get().historyIndex < get().history.length - 1,
  viewMode: (localStorage.getItem('viewMode') as ViewMode) || 'icon',
  setViewMode: (mode) => { localStorage.setItem('viewMode', mode); set({ viewMode: mode }); },
  sortField: 'name',
  sortDirection: 'asc',
  setSortField: (field) => set({ sortField: field }),
  setSortDirection: (direction) => set({ sortDirection: direction }),
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  browsePaths: [],
  setBrowsePaths: (paths) => set({ browsePaths: paths }),
  entries: [],
  setEntries: (entries) => set({ entries }),
  loading: false,
  setLoading: (loading) => set({ loading }),
}));
