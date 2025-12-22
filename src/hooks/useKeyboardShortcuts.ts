import { useEffect } from 'react';

export interface KeyboardShortcutsOptions {
  onSave?: () => void;
  onExportSVG?: () => void;
  onExportPNG?: () => void;
  onValidate?: () => void;
  onFix?: () => void;
  onGenerate?: () => void;
  onEscape?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

export function useKeyboardShortcuts(options: KeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      if (e.key === 'z' && isCmdOrCtrl && e.shiftKey) {
        e.preventDefault();
        options.onRedo?.();
      } else if (e.key === 'z' && isCmdOrCtrl) {
        e.preventDefault();
        options.onUndo?.();
      } else if (e.key === 'y' && isCmdOrCtrl) {
        // Windows Redo often Ctrl+Y
        e.preventDefault();
        options.onRedo?.();
      } else if (e.key === 's' && isCmdOrCtrl) {
        e.preventDefault();
        options.onSave?.();
      } else if (e.key === 'e' && isCmdOrCtrl && e.shiftKey) {
        e.preventDefault();
        options.onExportSVG?.();
      } else if (e.key === 'p' && isCmdOrCtrl && e.shiftKey) {
        e.preventDefault();
        options.onExportPNG?.();
      } else if (e.key === 'Enter' && isCmdOrCtrl) {
        e.preventDefault();
        options.onValidate?.();
      } else if (e.key === 'f' && isCmdOrCtrl && e.shiftKey) {
        e.preventDefault();
        options.onFix?.();
      } else if (e.key === 'g' && isCmdOrCtrl && e.shiftKey) {
        e.preventDefault();
        options.onGenerate?.();
      } else if (e.key === 'Escape') {
        options.onEscape?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [options]);
}
