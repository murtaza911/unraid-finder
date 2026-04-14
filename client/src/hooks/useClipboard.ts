import { useState, useCallback } from 'react';
import type { FileEntry, ClipboardState } from '../types/index.js';

export function useClipboard() {
  const [clipboard, setClipboard] = useState<ClipboardState>({ operation: null, files: [], sourcePath: '' });
  const copy = useCallback((files: FileEntry[], sourcePath: string) => setClipboard({ operation: 'copy', files, sourcePath }), []);
  const cut = useCallback((files: FileEntry[], sourcePath: string) => setClipboard({ operation: 'cut', files, sourcePath }), []);
  const clear = useCallback(() => setClipboard({ operation: null, files: [], sourcePath: '' }), []);
  return { clipboard, copy, cut, clear };
}
