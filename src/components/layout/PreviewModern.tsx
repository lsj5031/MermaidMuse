import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Box, Layers, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useDiagramState } from '@hooks/useDiagramState';
import Button from './Button';

const Preview: React.FC = () => {
  const { currentDiagram } = useDiagramState();
  const [viewMode, setViewMode] = useState<'2D' | '3D'>('2D');
  const containerRef = useRef<HTMLDivElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        fontFamily: 'Comic Neue',
        fontSize: '16px',
        primaryColor: '#E6F7E5',
        primaryBorderColor: '#2d2d2d',
        primaryTextColor: '#2d2d2d',
        lineColor: '#2d2d2d',
        secondaryColor: '#FCFBF5',
        tertiaryColor: '#fff',
      },
      securityLevel: 'loose',
    });
  }, []);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current) return;
      
      try {
        setError(null);
        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, currentDiagram.content);
        setSvgContent(svg);
      } catch (err) {
        console.error('Mermaid render error:', err);
        setError("Syntax Error in Diagram");
      }
    };

    const timer = setTimeout(renderDiagram, 500);
    return () => clearTimeout(timer);
  }, [currentDiagram.content]);

  const handleZoom = (direction: 'in' | 'out') => {
    setZoom(prev => {
      const newZoom = direction === 'in' ? prev + 10 : prev - 10;
      return Math.max(25, Math.min(newZoom, 200));
    });
  };

  const handleResetZoom = () => {
    setZoom(100);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    setZoom(prev => {
      const newZoom = e.deltaY > 0 ? prev - 10 : prev + 10;
      return Math.max(25, Math.min(newZoom, 200));
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 0) { // Left mouse button
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <section className="flex-grow flex flex-col h-full overflow-hidden relative">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b-2 border-gray-200 border-dashed bg-brand-green-light/40 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Preview</span>
          <span className="flex items-center gap-1.5 text-xs font-medium text-brand-green-dark bg-brand-green-light px-2 py-0.5 rounded-full border border-brand-green-dark/30">
            <span className="h-1.5 w-1.5 bg-brand-green-dark rounded-full animate-pulse"></span>
            Ready
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => handleZoom('out')} 
            className="px-2 py-1.5 text-xs font-semibold border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            icon={<ZoomOut size={14} />}
            title="Zoom out"
          >
            <span className="sr-only">Zoom out</span>
          </Button>
          <span className="text-xs font-semibold text-gray-700 min-w-[3rem] text-center">{zoom}%</span>
          <Button 
            onClick={() => handleZoom('in')} 
            className="px-2 py-1.5 text-xs font-semibold border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            icon={<ZoomIn size={14} />}
            title="Zoom in"
          >
            <span className="sr-only">Zoom in</span>
          </Button>
          <Button 
            onClick={handleResetZoom} 
            className="px-2 py-1.5 text-xs font-semibold border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            icon={<RotateCcw size={14} />}
            title="Reset zoom"
          >
            <span className="sr-only">Reset zoom</span>
          </Button>
          
          <div className="w-px h-6 bg-gray-300"></div>
          
          <Button 
            onClick={() => setViewMode('3D')} 
            className={`px-3 py-1.5 text-xs font-semibold border-2 border-gray-300 ${viewMode === '3D' ? 'bg-brand-blue text-white border-brand-blue ring-2 ring-offset-1 ring-blue-200' : 'bg-white text-gray-700'}`}
            icon={<Box size={14} />}
          >
            3D Scene
          </Button>
          <Button 
            onClick={() => setViewMode('2D')} 
            className={`px-3 py-1.5 text-xs font-semibold border-2 border-gray-300 ${viewMode === '2D' ? 'bg-brand-magenta text-white border-brand-magenta ring-2 ring-offset-1 ring-pink-200' : 'bg-white text-gray-700'}`}
            icon={<Layers size={14} />}
          >
            2D Mermaid
          </Button>
        </div>
      </div>

      {/* Canvas Area */}
      <div 
        className={`flex-grow relative bg-brand-cream bg-dotted-paper bg-dots overflow-auto flex items-center justify-center p-8 transition-colors duration-300 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50/50">
            <div className="border-sketch bg-white p-6 text-center max-w-md">
              <h3 className="text-red-600 font-bold mb-2">Diagram Syntax Error</h3>
              <p className="text-gray-500 text-sm">Please check your Mermaid syntax.</p>
            </div>
          </div>
        ) : (
          <div 
            ref={diagramRef}
            className="mermaid-output"
            dangerouslySetInnerHTML={{ __html: svgContent }}
            style={{ 
              opacity: svgContent ? 1 : 0, 
              transform: svgContent ? `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})` : 'scale(0.95)',
              transformOrigin: 'center',
              cursor: isDragging ? 'grabbing' : 'grab',
              transition: isDragging ? 'none' : 'all 0.5s ease-out',
            }}
          />
        )}
      </div>
    </section>
  );
};

export default Preview;
