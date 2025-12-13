import { useState, useEffect } from 'react';
import Header from '@components/layout/HeaderModern';
import Editor from '@components/layout/EditorModern';
import Preview from '@components/layout/PreviewModern';
import OnboardingModal from '@components/OnboardingModal';
import { DiagramProvider } from '@hooks/useDiagramState';
import { ProProvider } from '@hooks/usePro';
import { initializeDefaultThemes } from '@theme/defaultThemes';
import { savePendingReferralCode } from '@hooks/useReferral';
import './App.css';

// Initialize themes on app startup
initializeDefaultThemes();

function AppContent() {
  const [leftPaneWidth, setLeftPaneWidth] = useState(33.33); // percentage

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
      savePendingReferralCode(refCode);
    }
  }, []);

  const handleResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftPaneWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.min(Math.max(startWidth + (deltaX / window.innerWidth) * 100, 20), 50);
      setLeftPaneWidth(newWidth);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div className="flex flex-col h-screen font-sans">
      <Header />

      <main className="flex-grow flex overflow-hidden relative">
        {/* Left Pane: Code Editor */}
        <div style={{ width: `${leftPaneWidth}%` }} className="flex-shrink-0 h-full relative group">
          <Editor />
        </div>

        {/* Resizer Handle */}
        <div
          className="w-1.5 hover:w-2 bg-gray-200 hover:bg-brand-blue cursor-col-resize z-20 flex items-center justify-center transition-all absolute"
          style={{ left: `${leftPaneWidth}%`, top: 0, bottom: 0 }}
          onMouseDown={handleResize}
        >
          <div className="h-8 w-1 bg-gray-400 rounded-full" />
        </div>

        {/* Right Pane: Preview */}
        <div
          className="flex-grow h-full"
          style={{ width: `${100 - leftPaneWidth}%`, marginLeft: '0.375rem' }}
        >
          <Preview />
        </div>
      </main>

      <OnboardingModal />
    </div>
  );
}

function App() {
  return (
    <ProProvider>
      <DiagramProvider>
        <AppContent />
      </DiagramProvider>
    </ProProvider>
  );
}

export default App;
