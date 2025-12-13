import { useState } from 'react';
import EditorPanel from '@components/editor/EditorPanel';
import PreviewPanel from '@components/preview/PreviewPanel';
import StatusBanner from '@components/StatusBanner';
import ProblemsPanel from '@components/ProblemsPanel';
import { useSplitLayout } from '@hooks/useResponsive';
import { Settings, FileText } from 'lucide-react';

export default function MainContent() {
  const { shouldStackLayout } = useSplitLayout();
  const [splitMode] = useState(true);
  const [problemsOpen, setProblemsOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<'editor' | 'preview'>('editor');

  const toggleProblemsPanel = () => {
    setProblemsOpen(!problemsOpen);
  };

  return (
    <main className="flex-1 overflow-hidden relative">
      {/* Status Banner */}
      <StatusBanner onProblemsClick={toggleProblemsPanel} />

      <div id="workspace-capture" className="flex h-full">
        {splitMode ? (
          <>
            {/* Main Editor/Preview Area */}
            <div className={`flex ${problemsOpen ? 'mr-80' : ''} transition-all duration-300`}>
              {shouldStackLayout ? (
                // Mobile/Tablet Stack Layout
                <div className="flex flex-col w-full">
                  <div className="flex border-b border-dark-border">
                    <button
                      onClick={() => setActivePanel('editor')}
                      className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                        activePanel === 'editor'
                          ? 'bg-cyan-900/30 text-cyan-400 border-b-2 border-cyan-400'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Editor
                    </button>
                    <button
                      onClick={() => setActivePanel('preview')}
                      className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                        activePanel === 'preview'
                          ? 'bg-cyan-900/30 text-cyan-400 border-b-2 border-cyan-400'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="w-4 h-4" />
                        Preview
                      </div>
                    </button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    {activePanel === 'editor' ? <EditorPanel /> : <PreviewPanel />}
                  </div>
                </div>
              ) : (
                // Desktop Split Layout
                <div className="flex w-full h-full">
                  <div className="w-1/2 border-r border-dark-border overflow-hidden">
                    <EditorPanel />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <PreviewPanel />
                  </div>
                </div>
              )}
            </div>

            {/* Problems Panel - Desktop/Docked */}
            {!shouldStackLayout && (
              <div
                className={`fixed right-0 top-0 h-full transition-transform duration-300 z-10 ${
                  problemsOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
              >
                <div className="w-80 h-full">
                  <ProblemsPanel isOpen={problemsOpen} onClose={() => setProblemsOpen(false)} />
                </div>
              </div>
            )}

            {/* Problems Panel - Mobile/Overlay */}
            {shouldStackLayout && (
              <div
                className={`absolute inset-0 z-20 transition-opacity duration-300 ${
                  problemsOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
              >
                <div
                  className="absolute inset-0 bg-black/50"
                  onClick={() => setProblemsOpen(false)}
                />
                <div className="absolute right-0 top-0 h-full w-80 max-w-[90vw]">
                  <ProblemsPanel isOpen={problemsOpen} onClose={() => setProblemsOpen(false)} />
                </div>
              </div>
            )}
          </>
        ) : (
          // Single Panel Mode
          <div className="w-full">
            <EditorPanel />
          </div>
        )}
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-30">
        <button
          onClick={toggleProblemsPanel}
          className={`p-3 rounded-full shadow-lg transition-all duration-200 ${
            problemsOpen
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-dark-surface hover:bg-dark-border text-gray-400 hover:text-white border border-dark-border'
          }`}
          title={problemsOpen ? 'Close Problems' : 'Show Problems'}
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Responsive Hint for Mobile */}
      {shouldStackLayout && (
        <div className="absolute top-4 left-4 bg-dark-surface/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-dark-border">
          <p className="text-xs text-gray-400">Use tabs to switch between Editor and Preview</p>
        </div>
      )}
    </main>
  );
}
