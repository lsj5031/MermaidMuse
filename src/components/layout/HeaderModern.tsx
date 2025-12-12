import React from 'react';
import { ChevronDown, Download, Share2, RotateCcw } from 'lucide-react';
import { useDiagramState } from '@hooks/useDiagramState';
import { exportMermaidAsSVG } from '@utils/exportHelpers';
import { type DiagramTheme } from '@theme/diagramThemes';
import Button from './Button';

const Header: React.FC = () => {
  const { currentDiagram, canExport, resetDiagram, theme, setTheme } = useDiagramState();
  const [toast, setToast] = React.useState<string | null>(null);

  const handleExportSvg = async () => {
    try {
      await exportMermaidAsSVG(currentDiagram.content, currentDiagram.title, theme, {
        watermarkText: 'MermaidMuse',
      });
      showToast('SVG downloaded');
    } catch (err) {
      console.error(err);
      showToast('SVG export failed');
    }
  };

  const handleShare = async () => {
    const url = new URL(window.location.href);
    url.hash = `mmd=${encodeURIComponent(currentDiagram.content)}`;
    try {
      const shareData = {
        title: currentDiagram.title,
        text: 'Mermaid diagram (paste into MermaidMuse):',
        url: url.toString(),
      };

      if (navigator.share) {
        await navigator.share(shareData);
        showToast('Share sheet opened');
        return;
      }

      await navigator.clipboard.writeText(url.toString());
      showToast('Share link copied');
    } catch (err) {
      console.error(err);
      showToast('Share failed');
    }
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2200);
  };

  const actionButtonClass = (enabled: boolean) =>
    `inline-flex items-center gap-2 px-3 py-1.5 rounded border-sketch text-xs font-semibold transition-colors ${
      enabled
        ? 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300'
        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
    }`;

  return (
    <header className="bg-[#E6F7E5] shadow-sm flex items-center justify-between px-4 py-3 flex-shrink-0 z-10 border-b-2 border-gray-200 border-dashed">
      <h1 className="text-2xl font-headline text-gray-800 tracking-wide">MermaidMuse</h1>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 hidden sm:flex">
          <label htmlFor="theme-select" className="text-sm font-medium text-gray-600">Theme:</label>
          <div className="relative">
            <select 
              id="theme-select"
              value={theme}
              onChange={(e) => setTheme(e.target.value as DiagramTheme)}
              className="appearance-none border-sketch bg-white pl-3 pr-8 py-1.5 text-sm font-medium focus:outline-none cursor-pointer text-gray-700"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="cyber">Cyber</option>
            </select>
            <ChevronDown className="h-4 w-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
          </div>
        </div>

        <div className="flex items-center gap-2">
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
      </div>

      {toast && (
        <div className="absolute right-4 top-full mt-2 bg-white border border-sketch rounded px-3 py-2 text-xs text-gray-700 shadow-lg">
          {toast}
        </div>
      )}
    </header>
  );
};

export default Header;
