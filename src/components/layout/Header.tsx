import { useEffect, useMemo, useState } from 'react';
import { useDiagramState } from '@hooks/useDiagramState';
import { exportMermaidAsSVG } from '@utils/exportHelpers';
import { Menu, Download, Share2, RotateCcw, Edit3 } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
  shouldShowSidebar: boolean;
}

const buildShareUrl = (content: string): string => {
  const url = new URL(window.location.href);
  url.hash = `mmd=${encodeURIComponent(content)}`;
  return url.toString();
};

export default function Header({ onToggleSidebar, shouldShowSidebar }: HeaderProps) {
  const { currentDiagram, canExport, resetDiagram, theme, updateDiagramTitle } = useDiagramState();

  const [toast, setToast] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(currentDiagram.title);

  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  useEffect(() => {
    setTitleValue(currentDiagram.title);
  }, [currentDiagram.title]);

  const handleTitleEdit = () => {
    setIsEditingTitle(true);
    setTitleValue(currentDiagram.title);
  };

  const handleTitleSave = () => {
    if (titleValue.trim() && titleValue !== currentDiagram.title) {
      updateDiagramTitle(titleValue.trim());
      showToast('Title updated');
    }
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setTitleValue(currentDiagram.title);
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const shareUrl = useMemo(() => buildShareUrl(currentDiagram.content), [currentDiagram.content]);

  const showToast = (message: string) => setToast(message);

  const handleExportSvg = async () => {
    try {
      await exportMermaidAsSVG(currentDiagram.content, currentDiagram.title, {
        watermarkText: 'Diagram Maker',
      });
      showToast('SVG downloaded');
    } catch (err) {
      console.error(err);
      showToast('SVG export failed');
    }
  };

  const handleShare = async () => {
    try {
      const shareData = {
        title: currentDiagram.title,
        text: 'Mermaid diagram (paste into Diagram Studio):',
        url: shareUrl,
      };

      if (navigator.share) {
        await navigator.share(shareData);
        showToast('Share sheet opened');
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      showToast('Share link copied');
    } catch (err) {
      console.error(err);
      showToast('Share failed');
    }
  };

  const actionButtonClass = (enabled: boolean) =>
    `inline-flex items-center gap-2 px-3 py-2 rounded border text-xs font-semibold transition-colors ${
      enabled
        ? 'bg-dark-surface2 hover:bg-dark-border border-dark-border text-white'
        : 'bg-dark-surface border-dark-border text-gray-500 cursor-not-allowed'
    }`;

  return (
    <header className="bg-dark-surface border-b border-dark-border h-16 flex items-center px-4 shadow-lg relative">
      {shouldShowSidebar && (
        <button
          onClick={onToggleSidebar}
          className="mr-3 p-2 hover:bg-dark-surface2 rounded transition-colors"
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
        >
          <Menu size={22} className="text-neon-cyan" />
        </button>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold truncate">
            <span className="text-neon-cyan">{'<'}</span>
            {isEditingTitle ? (
              <input
                type="text"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                className="bg-transparent border-b border-neon-cyan outline-none text-white min-w-0 max-w-xs"
                autoFocus
              />
            ) : (
              <span
                className="cursor-pointer hover:text-neon-cyan transition-colors"
                onClick={handleTitleEdit}
                title="Click to edit title"
              >
                {currentDiagram.title}
              </span>
            )}
            <span className="text-neon-cyan">{' />'}</span>
          </h1>
          {!isEditingTitle && (
            <button
              onClick={handleTitleEdit}
              className="p-1 hover:bg-dark-surface2 rounded transition-colors opacity-60 hover:opacity-100"
              title="Edit title"
            >
              <Edit3 size={14} />
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400">Updated {currentDiagram.lastModified.toLocaleTimeString()}</p>
      </div>

      <div className="flex items-center gap-2">
        {!isOnline && (
          <span
            className="text-xs px-2 py-1 rounded border border-yellow-700/50 bg-yellow-900/20 text-yellow-300"
            title="You are offline. The editor will keep working with cached assets."
          >
            Offline
          </span>
        )}

        <button
          onClick={handleExportSvg}
          disabled={!canExport}
          className={actionButtonClass(canExport)}
          title={canExport ? 'Download a watermarked SVG' : 'Fix errors to export'}
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">SVG</span>
        </button>

        <button
          onClick={handleShare}
          className={actionButtonClass(true)}
          title="Copy a share link (stores the diagram in the URL)"
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Share</span>
        </button>

        <button
          onClick={resetDiagram}
          className={actionButtonClass(true)}
          title="Reset to the sample diagram"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {toast && (
        <div className="absolute right-4 top-full mt-2 bg-dark-surface border border-dark-border rounded px-3 py-2 text-xs text-gray-200 shadow-lg">
          {toast}
        </div>
      )}
    </header>
  );
}
