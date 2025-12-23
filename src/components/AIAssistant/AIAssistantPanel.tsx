import React, { useMemo, useState } from 'react';
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { useAIAssistant } from '@hooks/useAIAssistant';
import { useCredits } from '@hooks/useCredits';
import { useDiagramState } from '@hooks/useDiagramState';
import type { Suggestion } from '@utils/analyzeDiagramApi';
import {
  Lightbulb,
  AlertTriangle,
  Layout,
  Info,
  RefreshCw,
  X,
  ChevronRight,
  Zap,
  Bot,
  Copy,
} from 'lucide-react';

interface AIAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const getSuggestionIcon = (type: Suggestion['type']) => {
  switch (type) {
    case 'improvement':
      return <Lightbulb className="h-4 w-4 text-yellow-500" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    case 'pattern':
      return <Layout className="h-4 w-4 text-blue-500" />;
    default:
      return <Info className="h-4 w-4 text-gray-500" />;
  }
};

const titleForType: Record<Suggestion['type'], string> = {
  improvement: 'Improvements',
  warning: 'Warnings',
  pattern: 'Patterns',
  tip: 'Tips',
};

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({ isOpen, onClose }) => {
  const { currentDiagram, updateDiagramContent } = useDiagramState();
  const {
    creditsBalance,
    isLoading: isCreditsLoading,
    createCheckoutSession,
    refresh: refreshCredits,
  } = useCredits();

  const [autoAnalyze, setAutoAnalyze] = useState(false);
  const [expandedSuggestionId, setExpandedSuggestionId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const {
    suggestions,
    complexity,
    diagramType,
    isAnalyzing,
    error,
    analyze,
    dismiss,
    hasChanges,
    lastResponse,
  } = useAIAssistant(currentDiagram.content, { autoAnalyze, debounceMs: 3000 });

  const groupedSuggestions = useMemo(() => {
    const groups: Record<Suggestion['type'], Suggestion[]> = {
      improvement: [],
      warning: [],
      pattern: [],
      tip: [],
    };

    for (const suggestion of suggestions) {
      groups[suggestion.type].push(suggestion);
    }

    return groups;
  }, [suggestions]);

  if (!isOpen) return null;

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 1800);
  };

  const handleAnalyze = async () => {
    const result = await analyze();
    if (result?.creditsCharged) {
      void refreshCredits();
    }
  };

  const handleAction = async (suggestion: Suggestion) => {
    const action = suggestion.action;
    if (!action) return;

    if (action.type === 'show_example') {
      setExpandedSuggestionId((prev) => (prev === suggestion.id ? null : suggestion.id));
      return;
    }

    if (action.type === 'apply_fix') {
      if (typeof action.payload === 'string' && action.payload.trim()) {
        updateDiagramContent(action.payload);
        dismiss(suggestion.id);
        showToast('Applied suggested change');
        return;
      }

      if (typeof suggestion.lineNumber === 'number' && suggestion.lineNumber > 0) {
        const lines = currentDiagram.content.split(/\r?\n/);
        const index = suggestion.lineNumber - 1;
        if (index >= 0 && index < lines.length) {
          lines.splice(index, 1);
          updateDiagramContent(lines.join('\n'));
          dismiss(suggestion.id);
          showToast('Applied suggested change');
          return;
        }
      }

      showToast('No fix payload provided');
      return;
    }

    if (action.type === 'learn_more') {
      if (typeof action.payload === 'string' && action.payload.startsWith('http')) {
        window.open(action.payload, '_blank', 'noopener,noreferrer');
      } else {
        showToast('No link available');
      }
    }
  };

  const handleCopyExample = async (payload: string) => {
    try {
      await navigator.clipboard.writeText(payload);
      showToast('Copied example to clipboard');
    } catch {
      showToast('Copy failed');
    }
  };

  const isOutOfCredits = creditsBalance !== null && creditsBalance < 1;
  const isCreditsReady = !isCreditsLoading && creditsBalance !== null;
  const canAnalyze = isCreditsReady && creditsBalance >= 1;

  return (
    <aside className="w-80 border-l border-gray-200 bg-white flex flex-col h-full shadow-lg">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-emerald-600" />
          <h2 className="font-semibold text-gray-800">AI Assistant</h2>
        </div>

        <div className="flex items-center gap-3">
          <label
            className="flex items-center gap-2 text-xs text-gray-600 select-none"
            title="Auto analyze after you stop typing (costs credits)"
          >
            <input
              type="checkbox"
              checked={autoAnalyze}
              onChange={(e) => setAutoAnalyze(e.target.checked)}
              className="rounded border-gray-300"
            />
            Auto
          </label>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" title="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Complexity */}
        {complexity && (
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <Zap className="h-4 w-4 text-emerald-600" />
            <span className="text-sm text-gray-700">
              <span className="font-semibold">Complexity:</span> {complexity.level} (
              {complexity.nodeCount} nodes)
            </span>
          </div>
        )}

        {/* Diagram Type */}
        {diagramType && (
          <div className="text-sm text-gray-500">
            Detected type: <span className="font-medium">{diagramType}</span>
          </div>
        )}

        {/* Error */}
        {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

        {/* Last credits */}
        {lastResponse?.creditsRemaining !== undefined && (
          <div className="text-xs text-gray-400">
            Credits remaining: <span className="font-medium">{lastResponse.creditsRemaining}</span>
          </div>
        )}

        {/* Suggestions */}
        {(Object.keys(groupedSuggestions) as Suggestion['type'][]).map((type) => {
          const items = groupedSuggestions[type];
          if (items.length === 0) return null;

          return (
            <div key={type} className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase">
                {titleForType[type]}
              </h3>
              {items.map((suggestion) => (
                <div key={suggestion.id} className="p-3 bg-gray-50 rounded-lg text-sm space-y-2">
                  <div className="flex items-start gap-2">
                    {getSuggestionIcon(suggestion.type)}
                    <div className="flex-1">
                      <p className="text-gray-800">{suggestion.message}</p>
                      {suggestion.details && (
                        <p className="text-gray-500 text-xs mt-1">{suggestion.details}</p>
                      )}
                      {suggestion.lineNumber && (
                        <p className="text-gray-400 text-xs">Line {suggestion.lineNumber}</p>
                      )}
                    </div>
                    <button
                      onClick={() => dismiss(suggestion.id)}
                      className="text-gray-300 hover:text-gray-500"
                      title="Dismiss"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>

                  {suggestion.action && (
                    <button
                      onClick={() => void handleAction(suggestion)}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {suggestion.action.label}
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  )}

                  {suggestion.action?.type === 'show_example' &&
                    expandedSuggestionId === suggestion.id &&
                    typeof suggestion.action.payload === 'string' && (
                      <div className="bg-white border border-gray-200 rounded p-2 text-xs">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-semibold text-gray-600">Example</span>
                          <button
                            onClick={() => void handleCopyExample(suggestion.action?.payload ?? '')}
                            className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
                            title="Copy"
                          >
                            <Copy className="h-3 w-3" />
                            Copy
                          </button>
                        </div>
                        <pre className="whitespace-pre-wrap text-gray-700 font-mono">
                          {suggestion.action.payload}
                        </pre>
                      </div>
                    )}
                </div>
              ))}
            </div>
          );
        })}

        {/* Empty state */}
        {suggestions.length === 0 && !isAnalyzing && !error && (
          <div className="text-center text-gray-400 py-8">
            <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No suggestions yet</p>
            <p className="text-xs">Click Analyze to get AI insights</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 space-y-3">
        <SignedOut>
          <SignInButton mode="modal">
            <button className="w-full py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">
              Sign in to use AI Assistant
            </button>
          </SignInButton>
        </SignedOut>

        <SignedIn>
          {!isCreditsReady ? (
            <button
              disabled
              className="w-full py-2 bg-gray-100 text-gray-500 rounded-lg text-sm disabled:opacity-50 flex items-center justify-center"
            >
              Loading credits...
            </button>
          ) : isOutOfCredits ? (
            <button
              onClick={() => void createCheckoutSession()}
              className="w-full py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"
            >
              Top up credits to analyze
            </button>
          ) : (
            <button
              onClick={() => void handleAnalyze()}
              disabled={isAnalyzing || !canAnalyze}
              className="w-full py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  {hasChanges ? 'Analyze Changes' : 'Analyze Again'} (1 credit)
                </>
              )}
            </button>
          )}
        </SignedIn>

        {toast && <div className="text-xs text-gray-600 text-center">{toast}</div>}
      </div>
    </aside>
  );
};
