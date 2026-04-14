import { useEffect } from 'react';

interface KeyboardActions {
  onCopy?: () => void; onCut?: () => void; onPaste?: () => void; onSelectAll?: () => void;
  onDelete?: () => void; onRename?: () => void; onQuickLook?: () => void; onEscape?: () => void;
  onArrowUp?: () => void; onArrowDown?: () => void; onArrowLeft?: () => void; onArrowRight?: () => void;
}

export function useKeyboard(actions: KeyboardActions, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      if (meta && e.key === 'c') { e.preventDefault(); actions.onCopy?.(); }
      else if (meta && e.key === 'x') { e.preventDefault(); actions.onCut?.(); }
      else if (meta && e.key === 'v') { e.preventDefault(); actions.onPaste?.(); }
      else if (meta && e.key === 'a') { e.preventDefault(); actions.onSelectAll?.(); }
      else if (e.key === 'Backspace' || e.key === 'Delete') { actions.onDelete?.(); }
      else if (e.key === 'Enter') { e.preventDefault(); actions.onRename?.(); }
      else if (e.key === ' ') { e.preventDefault(); actions.onQuickLook?.(); }
      else if (e.key === 'Escape') { actions.onEscape?.(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); actions.onArrowUp?.(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); actions.onArrowDown?.(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); actions.onArrowLeft?.(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); actions.onArrowRight?.(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [actions, enabled]);
}
