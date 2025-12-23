import { useState, useEffect } from 'react';
import Header from '@components/layout/HeaderModern';
import Editor from '@components/layout/EditorModern';
import Preview from '@components/layout/PreviewModern';
import { AIAssistantPanel, RefinementChat } from '@components/AIAssistant';
import OnboardingModal from '@components/OnboardingModal';
import { DiagramProvider } from '@hooks/useDiagramState';
import { ProProvider } from '@hooks/usePro';
import { savePendingReferralCode } from '@hooks/useReferral';
import { useCredits } from '@hooks/useCredits';
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { initializeDefaultThemes } from '@theme/defaultThemes';
import { Bot, MessageSquare } from 'lucide-react';
import './App.css';

// Initialize themes on app startup
initializeDefaultThemes();

function AppContent() {
  const [leftPaneWidth, setLeftPaneWidth] = useState(33.33); // percentage
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isRefinementOpen, setIsRefinementOpen] = useState(false);
  const { creditsBalance, isLoading: isCreditsLoading, createCheckoutSession } = useCredits();

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

  const openAssistant = () => {
    setIsRefinementOpen(false);
    setIsAssistantOpen(true);
  };

  const openRefinement = () => {
    setIsAssistantOpen(false);
    setIsRefinementOpen(true);
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

        {/* AI Assistant Panel */}
        {!isAssistantOpen && (
          <button
            type="button"
            onClick={openAssistant}
            className="absolute bottom-4 right-4 z-30 p-3 rounded-full shadow-lg bg-white hover:bg-gray-50 text-gray-700 border border-gray-200"
            title="Open AI Assistant"
          >
            <Bot className="w-5 h-5" />
          </button>
        )}

        {/* AI Refinement Button */}
        {!isRefinementOpen && (
          <div className="absolute bottom-4 right-20 z-30">
            <SignedOut>
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="p-3 rounded-full shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500"
                  title="Sign in to refine diagrams with AI"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              {creditsBalance !== null && creditsBalance < 1 ? (
                <button
                  type="button"
                  onClick={() => void createCheckoutSession()}
                  className="p-3 rounded-full shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500"
                  title="Top up credits to refine diagrams"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={openRefinement}
                  disabled={isCreditsLoading || creditsBalance === null}
                  className="p-3 rounded-full shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500 disabled:opacity-50"
                  title="Refine your diagram through conversation (1 credit per refinement)"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
              )}
            </SignedIn>
          </div>
        )}

        <div className={`absolute top-0 right-0 bottom-0 z-40 ${isRefinementOpen ? '' : 'hidden'}`}>
          <RefinementChat isOpen={isRefinementOpen} onClose={() => setIsRefinementOpen(false)} />
        </div>

        <div className={`absolute top-0 right-0 bottom-0 z-40 ${isAssistantOpen ? '' : 'hidden'}`}>
          <AIAssistantPanel isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />
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
