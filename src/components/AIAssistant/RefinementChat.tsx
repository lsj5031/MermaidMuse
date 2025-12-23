import React, { useState } from 'react';
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { useAIRefinement } from '@hooks/useAIRefinement';
import { useCredits } from '@hooks/useCredits';
import { useDiagramState } from '@hooks/useDiagramState';
import {
  Send,
  Check,
  X,
  RotateCcw,
  Trash2,
  Plus,
  Minus,
  Sparkles,
  MessageSquare,
} from 'lucide-react';

const QUICK_ACTIONS = [
  {
    label: 'Add detail',
    instruction: 'Add more detail and specificity to the nodes and connections',
  },
  {
    label: 'Simplify',
    instruction: 'Simplify the diagram by combining related nodes and removing redundancy',
  },
  { label: 'Add errors', instruction: 'Add error handling paths and edge cases' },
  { label: 'Subgraphs', instruction: 'Organize related nodes into logical subgraphs' },
  { label: 'Labels', instruction: 'Add or improve edge labels to clarify relationships' },
];

interface RefinementChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RefinementChat: React.FC<RefinementChatProps> = ({ isOpen, onClose }) => {
  const { currentDiagram, updateDiagramContent } = useDiagramState();
  const {
    creditsBalance,
    createCheckoutSession,
    refresh: refreshCredits,
    spendOptimistically,
    cancelOptimisticSpend,
  } = useCredits();
  const {
    turns,
    isRefining,
    error,
    pendingResult,
    refine,
    applyPending,
    discardPending,
    undoToTurn,
    clearHistory,
  } = useAIRefinement(currentDiagram.id);

  const [inputValue, setInputValue] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (instruction: string) => {
    if (!instruction.trim() || isRefining) return;
    setInputValue('');
    spendOptimistically(1);
    const result = await refine(instruction, currentDiagram.content);
    if (result && result.ok) {
      void refreshCredits();
    } else {
      cancelOptimisticSpend(1);
    }
  };

  const handleApply = () => {
    const refinedText = applyPending();
    if (refinedText) {
      updateDiagramContent(refinedText);
      void refreshCredits();
    }
  };

  const handleUndo = (turnId: string) => {
    const previousDiagram = undoToTurn(turnId);
    if (previousDiagram) {
      updateDiagramContent(previousDiagram);
    }
  };

  return (
    <div className="w-96 border-l border-gray-200 bg-white flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-emerald-600" />
          <h2 className="font-semibold text-gray-800">Refine Diagram</h2>
        </div>
        <div className="flex items-center gap-2">
          {turns.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-gray-400 hover:text-red-500"
              title="Clear history"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Conversation History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {turns.length === 0 && !pendingResult && (
          <div className="text-center text-gray-400 py-8">
            <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Start refining your diagram</p>
            <p className="text-xs">Use quick actions or type a custom instruction</p>
          </div>
        )}

        {/* Past Turns */}
        {turns.map((turn) =>
          turn.role === 'user' ? (
            <div key={turn.id} className="flex justify-end">
              <div className="bg-emerald-100 text-emerald-900 rounded-lg px-3 py-2 max-w-[80%] text-sm">
                {turn.instruction}
              </div>
            </div>
          ) : (
            <div key={turn.id} className="space-y-2">
              <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm">
                <p className="text-gray-800">{turn.summary}</p>
              </div>
              <button
                onClick={() => handleUndo(turn.id)}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                title="Restore diagram state and discard later refinement turns"
              >
                <RotateCcw className="h-3 w-3" />
                Restore from here (discard later turns)
              </button>
            </div>
          )
        )}

        {/* Pending Result */}
        {pendingResult && (
          <div className="space-y-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-800">{pendingResult.summary}</p>

            {/* Changes Summary */}
            <div className="flex flex-wrap gap-2 text-xs">
              {pendingResult.changes.nodesAdded > 0 && (
                <span className="flex items-center gap-1 text-green-600">
                  <Plus className="h-3 w-3" />
                  {pendingResult.changes.nodesAdded} nodes
                </span>
              )}
              {pendingResult.changes.nodesRemoved > 0 && (
                <span className="flex items-center gap-1 text-red-600">
                  <Minus className="h-3 w-3" />
                  {pendingResult.changes.nodesRemoved} nodes
                </span>
              )}
            </div>

            {/* Suggestions */}
            {pendingResult.suggestions.length > 0 && (
              <div className="text-xs text-gray-500">
                <p className="font-medium">Suggestions:</p>
                <ul className="list-disc list-inside">
                  {pendingResult.suggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleApply}
                className="flex-1 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 flex items-center justify-center gap-1"
              >
                <Check className="h-4 w-4" />
                Apply Changes
              </button>
              <button
                onClick={discardPending}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

        {/* Loading */}
        {isRefining && (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <div className="animate-spin h-4 w-4 border-2 border-emerald-600 border-t-transparent rounded-full" />
            Refining diagram...
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 border-t border-gray-100">
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => void handleSubmit(action.instruction)}
              disabled={isRefining || pendingResult !== null}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <SignedOut>
          <SignInButton mode="modal">
            <button className="w-full py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">
              Sign in to refine diagrams
            </button>
          </SignInButton>
        </SignedOut>

        <SignedIn>
          {creditsBalance !== null && creditsBalance < 1 ? (
            <button
              onClick={() => void createCheckoutSession()}
              className="w-full py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"
            >
              Top up credits to refine
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void handleSubmit(inputValue)}
                placeholder="Describe your changes..."
                disabled={isRefining || pendingResult !== null}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-50"
              />
              <button
                onClick={() => void handleSubmit(inputValue)}
                disabled={isRefining || !inputValue.trim() || pendingResult !== null}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          )}
        </SignedIn>
      </div>
    </div>
  );
};
