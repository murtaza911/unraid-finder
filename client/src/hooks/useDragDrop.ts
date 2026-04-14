import { useState, useCallback, useEffect, useRef } from 'react';
import api from '../api/client.js';

export function useDragDrop(currentPath: string, onUploadComplete: () => void) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const handleDragEnter = useCallback((e: DragEvent) => { e.preventDefault(); dragCounter.current++; if (e.dataTransfer?.types.includes('Files')) setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: DragEvent) => { e.preventDefault(); dragCounter.current--; if (dragCounter.current === 0) setIsDragging(false); }, []);
  const handleDragOver = useCallback((e: DragEvent) => { e.preventDefault(); }, []);
  const handleDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault(); dragCounter.current = 0; setIsDragging(false);
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;
    const formData = new FormData();
    formData.append('path', currentPath);
    for (const file of Array.from(files)) formData.append('files', file);
    await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    onUploadComplete();
  }, [currentPath, onUploadComplete]);

  useEffect(() => {
    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);
    return () => { window.removeEventListener('dragenter', handleDragEnter); window.removeEventListener('dragleave', handleDragLeave); window.removeEventListener('dragover', handleDragOver); window.removeEventListener('drop', handleDrop); };
  }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);
  return { isDragging };
}
