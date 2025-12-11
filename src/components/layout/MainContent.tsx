import { useState } from 'react';
import EditorPanel from '@components/editor/EditorPanel';
import PreviewPanel from '@components/preview/PreviewPanel';

export default function MainContent() {
  const [splitMode] = useState(true);

  return (
    <main className="flex-1 overflow-hidden">
      <div className={`flex h-full ${splitMode ? '' : ''}`}>
        {splitMode ? (
          <>
            <div className="flex-1 border-r border-dark-border overflow-hidden">
              <EditorPanel />
            </div>
            <div className="flex-1 overflow-hidden">
              <PreviewPanel />
            </div>
          </>
        ) : (
          <>
            <EditorPanel />
          </>
        )}
      </div>
    </main>
  );
}
