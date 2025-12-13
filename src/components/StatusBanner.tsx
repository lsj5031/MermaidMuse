import React from 'react';
import { AlertTriangle, CheckCircle, Clock, X } from 'lucide-react';
// import { ValidationResult } from '@utils/validation';
import { useDiagramState } from '@hooks/useDiagramState';

interface StatusBannerProps {
  onProblemsClick: () => void;
}

export default function StatusBanner({ onProblemsClick }: StatusBannerProps) {
  const { currentDiagram } = useDiagramState();
  const { validation, isValidating } = currentDiagram;

  if (isValidating) {
    return (
      <div className="bg-blue-900/20 border-b border-blue-700/30 px-4 py-2">
        <div className="flex items-center gap-2 text-blue-400">
          <Clock className="w-4 h-4 animate-spin" />
          <span className="text-sm font-medium">Validating diagram...</span>
          <span className="text-xs text-blue-300">Syntax checking in progress</span>
        </div>
      </div>
    );
  }

  if (validation.isValid) {
    return (
      <div className="bg-green-900/20 border-b border-green-700/30 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Diagram is valid</span>
            <span className="text-xs text-green-300">
              {validation.warnings.length > 0 &&
                `${validation.warnings.length} warning${validation.warnings.length !== 1 ? 's' : ''}`}
            </span>
          </div>
          {validation.warnings.length > 0 && (
            <button
              onClick={onProblemsClick}
              className="text-xs text-green-300 hover:text-green-200 underline transition-colors"
            >
              View warnings
            </button>
          )}
        </div>
      </div>
    );
  }

  // Has errors
  const errorCount = validation.errors.length;
  const warningCount = validation.warnings.length;

  return (
    <div className="bg-red-900/20 border-b border-red-700/30 px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-red-400">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">
            {errorCount} error{errorCount !== 1 ? 's' : ''} found
          </span>
          {warningCount > 0 && (
            <span className="text-xs text-yellow-300">
              + {warningCount} warning{warningCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onProblemsClick}
            className="text-xs text-red-300 hover:text-red-200 underline transition-colors"
          >
            View details
          </button>
          <button
            className="p-1 text-red-400 hover:text-red-300 transition-colors"
            onClick={() => {
              // Dismiss banner - could be implemented with state management
            }}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Show first error message in banner */}
      {validation.errors.length > 0 && (
        <div className="mt-1 text-xs text-red-300">
          <span className="font-medium">Line {validation.errors[0].line}:</span>{' '}
          {validation.errors[0].message}
          <span className="ml-2 text-red-200/80">
            Lines with errors are highlighted in the editor.
          </span>
        </div>
      )}
    </div>
  );
}
