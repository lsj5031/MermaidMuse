import React from 'react';
import { Download, Share2, RotateCcw } from 'lucide-react';
import { useDiagramState } from '@hooks/useDiagramState';
import { exportMermaidAsSVG } from '@utils/exportHelpers';
import html2canvas from 'html2canvas';
import Button from './Button';

const Header: React.FC = () => {
  const { currentDiagram, canExport, resetDiagram } = useDiagramState();
  const [toast, setToast] = React.useState<string | null>(null);

  const handleExportSvg = async () => {
    try {
      await exportMermaidAsSVG(currentDiagram.content, currentDiagram.title, {
        watermarkText: 'MermaidMuse',
      });
      showToast('SVG downloaded');
    } catch (err) {
      console.error(err);
      showToast('SVG export failed');
    }
  };

  const handleExportPng = async () => {
    try {
      // Find the SVG in the preview
      const svgElement = document.querySelector('.mermaid-output svg');
      if (!svgElement) {
        showToast('No diagram to export');
        return;
      }

      // Clone the SVG to add watermark
      const svgClone = svgElement.cloneNode(true) as SVGElement;
      
      // Add watermark to SVG
      const ns = 'http://www.w3.org/2000/svg';
      const group = document.createElementNS(ns, 'g');
      group.setAttribute('pointer-events', 'none');
      
      const text = document.createElementNS(ns, 'text');
      text.textContent = 'MermaidMuse';
      text.setAttribute('x', '99%');
      text.setAttribute('y', '99%');
      text.setAttribute('text-anchor', 'end');
      text.setAttribute('dominant-baseline', 'auto');
      text.setAttribute('fill', '#2d2d2d');
      text.setAttribute('opacity', '0.85');
      text.setAttribute(
        'style',
        'font-family: "Comic Neue", system-ui, -apple-system, sans-serif; font-size: 14px; font-weight: bold; paint-order: stroke; stroke: rgba(255,255,255,0.6); stroke-width: 0.5px;'
      );
      group.appendChild(text);
      svgClone.appendChild(group);

      // Create a temporary container
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      container.style.backgroundColor = '#ffffff';
      container.appendChild(svgClone);
      document.body.appendChild(container);

      // Convert to canvas
      const canvas = await html2canvas(container, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });

      // Clean up
      document.body.removeChild(container);

      // Download PNG
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${currentDiagram.title || 'diagram'}.png`;
      link.click();
      
      showToast('PNG downloaded');
    } catch (err) {
      console.error(err);
      showToast('PNG export failed');
    }
  };

  const handleShare = async () => {
    const url = new URL(window.location.href);
    url.hash = `mmd=${encodeURIComponent(currentDiagram.content)}`;
    
    try {
      if (navigator.share) {
        const shareData = {
          title: currentDiagram.title,
          text: 'Mermaid diagram (paste into MermaidMuse):',
          url: url.toString(),
        };
        await navigator.share(shareData);
        showToast('Share sheet opened');
        return;
      }

      // Fallback to clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url.toString());
        showToast(`Link copied: ${url.toString().slice(0, 50)}...`);
        return;
      }

      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url.toString();
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showToast(`Link copied: ${url.toString().slice(0, 50)}...`);
    } catch (err) {
      console.error('Share error:', err);
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
    <header className="bg-[#E6F7E5] shadow-sm flex items-center justify-between px-4 py-3 flex-shrink-0 z-10 border-b-2 border-gray-200 border-dashed relative">
      <h1 className="text-2xl font-headline text-gray-800 tracking-wide">MermaidMuse</h1>

      <div className="flex items-center gap-4">
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
            onClick={handleExportPng}
            disabled={!canExport}
            className={actionButtonClass(canExport)}
            title={canExport ? 'Download a watermarked PNG' : 'Fix errors to export'}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">PNG</span>
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
        <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded px-4 py-3 text-sm text-gray-700 shadow-lg z-50">
          {toast}
        </div>
      )}
    </header>
  );
};

export default Header;
