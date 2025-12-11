import React from 'react';
import { AlertTriangle, X, CheckCircle, Clock } from 'lucide-react';
import { ValidationError } from '@utils/validation';
import { useDiagramState } from '@hooks/useDiagramState';

interface ProblemsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProblemsPanel({ isOpen, onClose }: ProblemsPanelProps) {
  const { currentDiagram } = useDiagramState();
  const { validation, isValidating } = currentDiagram;

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

  return (
    <div className="h-full flex flex-col bg-dark-surface border-l border-dark-border">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-dark-border">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-white">Problems</h3>
          {isValidating && (
            <Clock className="w-4 h-4 text-blue-400 animate-spin" />
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
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
                  // Could implement jumping to line in editor
                  console.log('Jump to line:', issue.line);
                }}
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
  );
}