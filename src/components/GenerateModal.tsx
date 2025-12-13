import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';

interface GenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (prompt: string, diagramType?: string, style?: 'concise' | 'detailed') => void;
  isGenerating: boolean;
}

const DIAGRAM_TYPES = [
  { value: '', label: 'Auto-detect' },
  { value: 'flowchart', label: 'Flowchart' },
  { value: 'sequence', label: 'Sequence' },
  { value: 'class', label: 'Class' },
  { value: 'state', label: 'State' },
  { value: 'er', label: 'Entity Relationship' },
  { value: 'gantt', label: 'Gantt' },
  { value: 'pie', label: 'Pie' },
  { value: 'mindmap', label: 'Mindmap' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'journey', label: 'User Journey' },
];

export default function GenerateModal({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
}: GenerateModalProps) {
  const [prompt, setPrompt] = useState('');
  const [diagramType, setDiagramType] = useState('');
  const [style, setStyle] = useState<'concise' | 'detailed'>('concise');

  const handleGenerate = () => {
    if (!prompt.trim() || isGenerating) return;

    onGenerate(prompt, diagramType || undefined, style);
  };

  const handleClose = () => {
    if (!isGenerating) {
      setPrompt('');
      setDiagramType('');
      setStyle('concise');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4">
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 rounded-lg p-3">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Generate Diagram with AI</h2>
              <p className="text-sm text-gray-500 mt-1">Describe your diagram in natural language</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isGenerating}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 disabled:opacity-50"
            title="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Describe your diagram <span className="text-red-500">*</span>
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Example: User signup flow with email verification, password validation, and welcome email..."
              rows={4}
              disabled={isGenerating}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Diagram Type</label>
              <select
                value={diagramType}
                onChange={(e) => setDiagramType(e.target.value)}
                disabled={isGenerating}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {DIAGRAM_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Detail Level</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value as 'concise' | 'detailed')}
                disabled={isGenerating}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="concise">Concise</option>
                <option value="detailed">Detailed</option>
              </select>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-900">
              <strong>💡 Tip:</strong> Be specific about what you want. Mention key steps, decisions,
              or entities you want to include in your diagram.
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleClose}
              disabled={isGenerating}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate (2 credits)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
