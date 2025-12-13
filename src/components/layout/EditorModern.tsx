import React, { useState } from 'react';
import { SignInButton, SignedIn, SignedOut, useAuth } from '@clerk/clerk-react';
import { useDiagramState } from '@hooks/useDiagramState';
import { useCredits } from '@hooks/useCredits';
import { useReferral } from '@hooks/useReferral';
import { CheckCircle2, AlertTriangle, Clock, Wand2, Sparkles, MessageSquare } from 'lucide-react';
import { fixDiagramSyntax } from '@utils/fixDiagramApi';
import { generateDiagram } from '@utils/generateDiagramApi';
import ReferralModal from '@components/ReferralModal';
import GenerateModal from '@components/GenerateModal';
import { RefinementChat } from '@components/AIAssistant/RefinementChat';

const Editor: React.FC = () => {
  const { currentDiagram, updateDiagramContent } = useDiagramState();
  const { getToken } = useAuth();
  const {
    creditsBalance,
    isLoading: isCreditsLoading,
    createCheckoutSession,
    refresh: refreshCredits,
  } = useCredits();
  const { showModal, triggerModal, closeModal, dismissModalPermanently } = useReferral();
  const [isFixing, setIsFixing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showRefinementChat, setShowRefinementChat] = useState(false);
  const lineCount = currentDiagram.content.split('\n').length;
  const { validation, isValidating } = currentDiagram;

  const handleFixWithAI = async () => {
    if (isFixing || !currentDiagram.content.trim()) return;

    setIsFixing(true);
    try {
      const token = await getToken();
      const result = await fixDiagramSyntax(currentDiagram.content, { token });

      if (result.ok && result.fixedText) {
        updateDiagramContent(result.fixedText);
        triggerModal();
      } else {
        console.warn('AI fix failed:', result.error?.message);
      }

      if (result.creditsCharged) {
        void refreshCredits();
      }
    } catch (err) {
      console.error('Failed to fix diagram:', err);
    } finally {
      setIsFixing(false);
    }
  };

  const handleGenerateWithAI = async (
    prompt: string,
    diagramType?: string,
    style?: 'concise' | 'detailed'
  ) => {
    if (isGenerating || !prompt.trim()) return;

    setIsGenerating(true);
    try {
      const token = await getToken();
      const result = await generateDiagram(prompt, { token, diagramType, style });

      if (result.ok && result.generatedText) {
        updateDiagramContent(result.generatedText);
        setShowGenerateModal(false);
      } else {
        console.warn('AI generation failed:', result.error?.message);
      }

      if (result.creditsCharged) {
        void refreshCredits();
      }
    } catch (err) {
      console.error('Failed to generate diagram:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <ReferralModal
        isOpen={showModal}
        onClose={closeModal}
        onDontShowAgain={dismissModalPermanently}
      />
      <GenerateModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onGenerate={handleGenerateWithAI}
        isGenerating={isGenerating}
      />
      <aside className="flex flex-col h-full bg-white border-r-2 border-gray-200 border-dashed shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
        {/* Status Bar */}
      <div
        className={`px-4 py-2 flex items-center justify-between gap-2 text-sm font-medium border-b border-gray-200 flex-shrink-0 ${
          isValidating
            ? 'bg-blue-50 text-blue-700'
            : validation.isValid
              ? 'bg-brand-green-light text-green-800'
              : 'bg-red-50 text-red-700'
        }`}
      >
        <div className="flex items-center gap-2">
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
                <span>
                  {validation.errors.length} error{validation.errors.length !== 1 ? 's' : ''}
                </span>
                {validation.errors.length > 0 && (
                  <span className="text-xs text-red-600">
                    Line {validation.errors[0].line}: {validation.errors[0].message}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* AI Fix Button - only show when there are errors */}
        {!validation.isValid && !isValidating && (
          <div className="ml-2 flex items-center gap-2">
            <SignedOut>
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="px-2 py-1 rounded text-xs font-medium bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-1 whitespace-nowrap"
                  title="Sign in to use AI fixing"
                >
                  <Wand2 className="h-3 w-3" />
                  <span>Sign in for AI fix</span>
                </button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              {creditsBalance !== null && creditsBalance < 1 ? (
                <button
                  type="button"
                  onClick={() => void createCheckoutSession()}
                  className="px-2 py-1 rounded text-xs font-medium bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-1 whitespace-nowrap"
                  title="Top up credits"
                >
                  <span>Top up credits</span>
                </button>
              ) : (
                <button
                  onClick={handleFixWithAI}
                  disabled={isFixing || isCreditsLoading || creditsBalance === null}
                  className="px-2 py-1 rounded text-xs font-medium bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 whitespace-nowrap"
                  title="Use AI to fix diagram syntax (costs 1 credit)"
                >
                  {isFixing ? (
                    <>
                      <Clock className="h-3 w-3 animate-spin" />
                      <span>Fixing...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-3 w-3" />
                      <span>Fix with AI (1 credit)</span>
                    </>
                  )}
                </button>
              )}
            </SignedIn>
          </div>
        )}
      </div>

      {/* AI Generate Button */}
      <div className="px-4 py-3 border-b border-gray-200 flex-shrink-0">
        <SignedOut>
          <SignInButton mode="modal">
            <button
              type="button"
              className="w-full px-3 py-2 rounded text-sm font-medium bg-purple-500 text-white hover:bg-purple-600 flex items-center justify-center gap-2"
              title="Sign in to generate diagrams with AI"
            >
              <Sparkles className="h-4 w-4" />
              <span>Generate with AI</span>
            </button>
          </SignInButton>
        </SignedOut>

        <SignedIn>
          {creditsBalance !== null && creditsBalance < 2 ? (
            <button
              type="button"
              onClick={() => void createCheckoutSession()}
              className="w-full px-3 py-2 rounded text-sm font-medium bg-purple-500 text-white hover:bg-purple-600 flex items-center justify-center gap-2"
              title="Top up credits to generate diagrams"
            >
              <Sparkles className="h-4 w-4" />
              <span>Top up for Generate (2 credits)</span>
            </button>
          ) : (
            <button
              onClick={() => setShowGenerateModal(true)}
              disabled={isGenerating || isCreditsLoading || creditsBalance === null}
              className="w-full px-3 py-2 rounded text-sm font-medium bg-purple-500 text-white hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              title="Generate a diagram from natural language (costs 2 credits)"
            >
              <Sparkles className="h-4 w-4" />
              <span>Generate with AI (2 credits)</span>
            </button>
          )}
        </SignedIn>
      </div>

      {/* AI Refinement Button */}
      <div className="px-4 py-2 border-b border-gray-200 flex-shrink-0">
        <SignedOut>
          <SignInButton mode="modal">
            <button
              type="button"
              className="w-full px-3 py-2 rounded text-sm font-medium bg-indigo-500 text-white hover:bg-indigo-600 flex items-center justify-center gap-2"
              title="Sign in to refine diagrams with AI"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Refine with AI</span>
            </button>
          </SignInButton>
        </SignedOut>

        <SignedIn>
          {creditsBalance !== null && creditsBalance < 1 ? (
            <button
              type="button"
              onClick={() => void createCheckoutSession()}
              className="w-full px-3 py-2 rounded text-sm font-medium bg-indigo-500 text-white hover:bg-indigo-600 flex items-center justify-center gap-2"
              title="Top up credits to refine diagrams"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Top up to Refine (1 credit)</span>
            </button>
          ) : (
            <button
              onClick={() => setShowRefinementChat(true)}
              disabled={isCreditsLoading || creditsBalance === null}
              className="w-full px-3 py-2 rounded text-sm font-medium bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              title="Refine your diagram through conversation (costs 1 credit per refinement)"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Refine with AI (1 credit)</span>
            </button>
          )}
        </SignedIn>
      </div>

      {/* Editor Area */}
      <div className="flex-grow flex overflow-hidden relative font-mono text-sm">
        {/* Line Numbers */}
        <div className="bg-gray-50 py-4 px-2 text-right text-gray-400 select-none border-r border-gray-100 min-w-[3rem]">
          {Array.from({ length: Math.max(lineCount, 15) }).map((_, i) => (
            <div key={i} className="leading-6 h-6">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          value={currentDiagram.content}
          onChange={(e) => updateDiagramContent(e.target.value)}
          className="flex-grow resize-none p-4 leading-6 focus:outline-none text-gray-700 bg-white w-full h-full font-mono whitespace-pre"
          spellCheck={false}
        />
      </div>

      {/* AI Refinement Chat */}
      <RefinementChat
        isOpen={showRefinementChat}
        onClose={() => setShowRefinementChat(false)}
      />
    </aside>
    </>
  );
};

export default Editor;
