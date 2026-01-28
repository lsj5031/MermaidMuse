import React, { useMemo } from 'react';
import { useDiagramState } from '@hooks/useDiagramState';
import { CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

const Editor: React.FC = () => {
  const { currentDiagram, updateDiagramContent } = useDiagramState();
  const lineCount = currentDiagram.content.split('\n').length;
  const { validation, isValidating } = currentDiagram;

  const lineNumbers = useMemo(
    () =>
      Array.from({ length: Math.max(lineCount, 15) }).map((_, i) => (
        <div key={i} className="leading-6 h-6">
          {i + 1}
        </div>
      )),
    [lineCount]
  );

  return (
    <aside className="flex flex-col h-full bg-white border-r-2 border-gray-200 border-dashed shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
      {/* Status Bar */}
      <div className={`px-4 py-2 flex items-center gap-2 text-sm font-medium border-b border-gray-200 flex-shrink-0 ${
        isValidating ? 'bg-blue-50 text-blue-700' :
        validation.isValid ? 'bg-brand-green-light text-green-800' : 
        'bg-red-50 text-red-700'
      }`}>
        {isValidating ? (
          <>
            <Clock className="h-4 w-4 animate-spin" />
            <span>Validating...</span>
          </>
        ) : validation.isValid ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-brand-green-dark" />
            <span>Diagram is valid</span>
          </>
        ) : (
          <>
            <AlertTriangle className="h-4 w-4" />
            <div className="flex flex-col gap-0.5">
              <span>{validation.errors.length} error{validation.errors.length !== 1 ? 's' : ''}</span>
              {validation.errors.length > 0 && (
                <span className="text-xs text-red-600">
                  Line {validation.errors[0].line}: {validation.errors[0].message}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Editor Area */}
      <div className="flex-grow flex overflow-hidden relative font-mono text-sm">
        {/* Line Numbers */}
        <div className="bg-gray-50 py-4 px-2 text-right text-gray-400 select-none border-r border-gray-100 min-w-[3rem]">
          {lineNumbers}
        </div>

        {/* Text Area */}
        <textarea
          value={currentDiagram.content}
          onChange={(e) => updateDiagramContent(e.target.value)}
          className="flex-grow resize-none p-4 leading-6 focus:outline-none text-gray-700 bg-white w-full h-full font-mono whitespace-pre"
          spellCheck={false}
        />
      </div>
    </aside>
  );
};

export default Editor;
