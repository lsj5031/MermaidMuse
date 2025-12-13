import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { useDiagramState } from '@hooks/useDiagramState';
import { getMermaidConfigForTheme } from '@theme/themeRegistry';
import { AlertTriangle, Loader2 } from 'lucide-react';

export default function PreviewPanel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { currentDiagram, canRender, theme } = useDiagramState();
  const { isValidating, content } = currentDiagram;

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current) return;

      // Don't render if validating or has errors
      if (isValidating || !canRender) {
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div class="flex items-center justify-center h-full">
              <div class="text-center">
                ${
                  isValidating
                    ? '<div class="flex items-center justify-center gap-2 text-blue-400"><svg class="w-5 h-5 animate-spin" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" class="opacity-25"/><path d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor"/></svg>Validating...</div>'
                    : '<div class="text-red-400"><svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg><p class="font-semibold">Cannot render invalid diagram</p><p class="text-sm text-gray-400 mt-2">Fix syntax errors to see preview</p></div>'
                }
              </div>
            </div>
          `;
        }
        return;
      }

      try {
        const config = getMermaidConfigForTheme(theme);
        if (config) {
          mermaid.initialize(config);
        }

        containerRef.current.innerHTML = '';

        const element = document.createElement('div');
        element.innerHTML = `<pre class="mermaid">${content}</pre>`;
        containerRef.current.appendChild(element);

        // Render mermaid with fresh render
        await mermaid.run();
        mermaid.contentLoaded();
      } catch (error) {
        console.error('Mermaid render error:', error);
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div class="flex items-center justify-center h-full">
              <div class="text-center text-red-400">
                <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                </svg>
                <p class="font-semibold">Failed to render diagram</p>
                <p class="text-sm text-gray-400 mt-2">${error instanceof Error ? error.message : 'Unknown error'}</p>
              </div>
            </div>
          `;
        }
      }
    };

    renderDiagram();
  }, [content, canRender, isValidating, theme]);

  return (
    <div className="h-full flex flex-col bg-dark-bg overflow-hidden">
      {/* Header with validation status */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-dark-border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">Preview</span>
          {isValidating && (
            <div className="flex items-center gap-1 text-blue-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="text-xs">Validating...</span>
            </div>
          )}
          {!isValidating && !canRender && (
            <div className="flex items-center gap-1 text-red-400">
              <AlertTriangle className="w-3 h-3" />
              <span className="text-xs">Invalid syntax</span>
            </div>
          )}
          {!isValidating && canRender && (
            <div className="flex items-center gap-1 text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-xs">Ready</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div
          ref={containerRef}
          className="w-full h-full flex items-center justify-center min-h-full p-8"
        />
      </div>
    </div>
  );
}
