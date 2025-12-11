import ThreeScene from '../ThreeScene';
import { useDiagramState } from '@hooks/useDiagramState';
import { AlertTriangle, Loader2 } from 'lucide-react';

export default function ThreeScenePanel() {
  const { currentDiagram, canRender } = useDiagramState();
  const { isValidating, content } = currentDiagram;

  const canShow3D = canRender && content.trim().length > 0;

  return (
    <div className="h-full flex flex-col bg-dark-bg overflow-hidden">
      {/* Header with validation status */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-dark-border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">3D Preview</span>
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
      
      <div className="flex-1 overflow-hidden">
        {!canShow3D ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              {!content.trim() ? (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-dark-surface rounded-full">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <p className="text-gray-400 font-medium mb-2">Empty Diagram</p>
                  <p className="text-gray-500 text-sm">Start typing Mermaid syntax to see 3D visualization</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-red-500/20 rounded-full">
                    <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <p className="text-red-400 font-medium mb-2">Cannot render invalid diagram</p>
                  <p className="text-gray-400 text-sm">Fix syntax errors to see 3D preview</p>
                </>
              )}
            </div>
          </div>
        ) : (
          <ThreeScene className="w-full h-full" />
        )}
      </div>
    </div>
  );
}