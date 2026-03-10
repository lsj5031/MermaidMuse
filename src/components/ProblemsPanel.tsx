import React, { useState } from 'react';
import { AlertTriangle, X, CheckCircle, Clock, Sparkles, Settings } from 'lucide-react';
import { ValidationError } from '@utils/validation';
import { useDiagramState } from '@hooks/useDiagramState';
import { useLLMConfig } from '@hooks/useLLMConfig';
import { LLMSettingsPanel } from '@components/LLMSettingsPanel';

interface ProblemsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProblemsPanel({ isOpen, onClose }: ProblemsPanelProps) {
  const { currentDiagram, revealInEditor, updateDiagramContent } = useDiagramState();
  const { isConfigured } = useLLMConfig();
  const { validation, isValidating } = currentDiagram;
  const [showSettings, setShowSettings] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [fixError, setFixError] = useState<string | null>(null);

  if (!isOpen) return null;

  const allIssues = [...validation.errors, ...validation.warnings];

  const getSeverityIcon = (severity: ValidationError['severity']) => {
    switch (severity) {
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      default:
        return <CheckCircle className="w-4 h-4 text-blue-400" />;
    }
  };

  const getSeverityColor = (severity: ValidationError['severity']) => {
    switch (severity) {
      case 'error':
        return 'text-red-400 hover:text-red-300';
      case 'warning':
        return 'text-yellow-400 hover:text-yellow-300';
      default:
        return 'text-blue-400 hover:text-blue-300';
    }
  };

  const handleFixWithAI = async () => {
    if (!isConfigured) {
      setShowSettings(true);
      return;
    }

    setIsFixing(true);
    setFixError(null);

    try {
      const response = await fetch('/api/fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diagramText: currentDiagram.content }),
      });

      const result = await response.json();

      if (result.ok && result.fixedText) {
        updateDiagramContent(result.fixedText);
      } else if (result.error) {
        setFixError(result.error.message || 'Failed to fix diagram');
      }
    } catch (err) {
      setFixError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsFixing(false);
    }
  };

  const hasErrors = validation.errors.length > 0;

  return (
    <>
      <div className="h-full flex flex-col bg-dark-surface border-l border-dark-border">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-dark-border">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-white">Problems</h3>
            {isValidating && (
              <Clock className="w-4 h-4 text-blue-400 animate-spin" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="p-1 text-gray-400 hover:text-white transition-colors"
              title="LLM Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Summary */}
        <div className="p-3 border-b border-dark-border">
          {isValidating ? (
            <div className="flex items-center gap-2 text-blue-400">
              <Clock className="w-4 h-4 animate-spin" />
              <span className="text-sm">Validating diagram...</span>
            </div>
          ) : validation.isValid && allIssues.length === 0 ? (
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">No problems detected</span>
            </div>
          ) : (
            <div className="text-sm text-gray-400">
              {validation.errors.length > 0 && (
                <span className="text-red-400 mr-3">
                  {validation.errors.length} error{validation.errors.length !== 1 ? 's' : ''}
                </span>
              )}
              {validation.warnings.length > 0 && (
                <span className="text-yellow-400">
                  {validation.warnings.length} warning{validation.warnings.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Fix with AI Button */}
        {hasErrors && (
          <div className="p-3 border-b border-dark-border">
            <button
              onClick={handleFixWithAI}
              disabled={isFixing}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors ${
                isConfigured
                  ? 'bg-brand-blue text-white hover:bg-blue-600'
                  : 'bg-dark-bg border border-dark-border text-gray-300 hover:border-brand-blue'
              } ${isFixing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Sparkles className="w-4 h-4" />
              {isFixing ? 'Fixing...' : isConfigured ? 'Fix with AI' : 'Configure AI to Fix'}
            </button>
            {fixError && (
              <p className="mt-2 text-xs text-red-400">{fixError}</p>
            )}
            {!isConfigured && (
              <p className="mt-2 text-xs text-gray-500">
                Set up your LLM API key to enable AI-powered syntax fixing
              </p>
            )}
          </div>
        )}

        {/* Issues List */}
        <div className="flex-1 overflow-y-auto">
          {isValidating ? (
            <div className="p-4 text-center text-gray-400">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="w-5 h-5 animate-spin text-blue-400" />
                <span className="text-sm">Validating syntax...</span>
              </div>
              <p className="text-xs">Please wait while we check your diagram</p>
            </div>
          ) : allIssues.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
              <p className="text-sm">Your diagram looks good!</p>
            </div>
          ) : (
            <div className="p-2">
              {allIssues.map((issue, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg mb-2 bg-dark-bg border-l-4 transition-colors cursor-pointer ${
                    issue.severity === 'error' 
                      ? 'border-red-400 hover:bg-red-900/10' 
                      : issue.severity === 'warning'
                      ? 'border-yellow-400 hover:bg-yellow-900/10'
                      : 'border-blue-400 hover:bg-blue-900/10'
                  }`}
                  onClick={() => {
                    revealInEditor(issue.line, issue.column);
                  }}
                  title="Jump to the highlighted line"
                >
                  <div className="flex items-start gap-2">
                    {getSeverityIcon(issue.severity)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                          {issue.severity.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-400">
                          Line {issue.line}, Column {issue.column}
                        </span>
                      </div>
                      <p className="text-sm text-white leading-relaxed">
                        {issue.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Offline/Fallback Message */}
        {validation.mermaidError && (
          <div className="p-3 border-t border-dark-border bg-yellow-900/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-yellow-400 font-medium mb-1">Validation Note</p>
                <p className="text-xs text-gray-400">
                  {validation.mermaidError.toLowerCase().includes('network') || 
                   validation.mermaidError.toLowerCase().includes('offline')
                    ? 'Offline validation: Some syntax checks may be limited. Check your connection for full validation.'
                    : 'Validation completed with limitations. Some advanced syntax checks may not be available.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <LLMSettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
}