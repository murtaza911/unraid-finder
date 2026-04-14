import { useState, useCallback } from 'react';
import type { FileEntry } from '../types/index.js';

export function useSelection(entries: FileEntry[]) {
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const select = useCallback((path: string, meta: { cmd?: boolean; shift?: boolean } = {}) => {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (meta.cmd) { if (next.has(path)) next.delete(path); else next.add(path); }
      else if (meta.shift && prev.size > 0) {
        const lastSelected = Array.from(prev).pop()!;
        const startIdx = entries.findIndex((e) => e.path === lastSelected);
        const endIdx = entries.findIndex((e) => e.path === path);
        const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
        entries.slice(from, to + 1).forEach((e) => next.add(e.path));
      } else { next.clear(); next.add(path); }
      return next;
    });
  }, [entries]);
  const selectAll = useCallback(() => setSelectedPaths(new Set(entries.map((e) => e.path))), [entries]);
  const clearSelection = useCallback(() => setSelectedPaths(new Set()), []);
  const selectedEntries = entries.filter((e) => selectedPaths.has(e.path));
  return { selectedPaths, selectedEntries, select, selectAll, clearSelection };
}
