import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { useDiagramState } from '@hooks/useDiagramState';

export default function PreviewPanel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { currentDiagram } = useDiagramState();

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current) return;

      try {
        mermaid.initialize({ startOnLoad: true, theme: 'dark' });
        containerRef.current.innerHTML = '';

        const element = document.createElement('div');
        element.innerHTML = `<pre class="mermaid">${currentDiagram.content}</pre>`;
        containerRef.current.appendChild(element);

        await mermaid.contentLoaded();
      } catch (error) {
        console.error('Mermaid render error:', error);
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div class="flex items-center justify-center h-full">
              <div class="text-red-400">
                <p class="font-semibold">Invalid diagram syntax</p>
                <p class="text-sm text-gray-400 mt-2">Check your mermaid syntax</p>
              </div>
            </div>
          `;
        }
      }
    };

    renderDiagram();
  }, [currentDiagram.content]);

  return (
    <div className="h-full flex flex-col bg-dark-bg overflow-hidden">
      <div className="flex-1 overflow-auto flex items-center justify-center">
        <div ref={containerRef} className="w-full h-full flex items-center justify-center p-4" />
      </div>
    </div>
  );
}
