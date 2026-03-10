import React, { useMemo, useState } from 'react';
import { useDiagramState } from '@hooks/useDiagramState';
import { useLLMConfig } from '@hooks/useLLMConfig';
import { CheckCircle2, AlertTriangle, Clock, Sparkles } from 'lucide-react';
import { LLMSettingsPanel } from '@components/LLMSettingsPanel';

const Editor: React.FC = () => {
  const { currentDiagram, updateDiagramContent } = useDiagramState();
  const { config, isConfigured } = useLLMConfig();
  const lineCount = currentDiagram.content.split('\n').length;
  const { validation, isValidating } = currentDiagram;
  const [showSettings, setShowSettings] = useState(false);
  const [isFixing, setIsFixing] = useState(false);


  const handleFixWithAI = async () => {
    if (!isConfigured) {
      setShowSettings(true);
      return;
    }

    setIsFixing(true);

    try {
      const { baseUrl, apiKey, model } = config!;
      const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0,
          messages: [
            {
              role: 'system',
              content:
                'You are a meticulous Mermaid syntax expert. Fix ONLY syntax errors and preserve intent. ' +
                'Return a JSON object with keys: fixedText (string), suggestions (string[]). ' +
                'Do not include markdown fences. Do not include any other keys.',
            },
            {
              role: 'user',
              content:
                'Fix Mermaid syntax errors in the following diagram. Preserve formatting where possible.\n\n' +
                currentDiagram.content,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API error: ${response.status}`);
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('Empty response from LLM');
      }

      let parsed;
      try {
        parsed = JSON.parse(content.trim());
      } catch {
        const firstBrace = content.indexOf('{');
        const lastBrace = content.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          parsed = JSON.parse(content.slice(firstBrace, lastBrace + 1));
        } else {
          throw new Error('Could not parse LLM response');
        }
      }

      if (parsed.fixedText) {
        updateDiagramContent(parsed.fixedText);
      }
    } catch (err) {
      console.error('Fix with AI error:', err);
    } finally {
      setIsFixing(false);
    }
  };

  const lineNumbers = useMemo(
    () =>
      Array.from({ length: Math.max(lineCount, 15) }).map((_, i) => (
        <div key={i} className="leading-6 h-6">
          {i + 1}
        </div>
      )),
    [lineCount]
  );

  return (
    <aside className="flex flex-col h-full bg-white border-r-2 border-gray-200 border-dashed shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
      {/* Status Bar */}
      <div className={`px-4 py-2 flex items-center gap-2 text-sm font-medium border-b border-gray-200 flex-shrink-0 ${isValidating ? 'bg-blue-50 text-blue-700' :
          validation.isValid ? 'bg-brand-green-light text-green-800' :
            'bg-red-50 text-red-700'
        }`}>
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
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span>{validation.errors.length} error{validation.errors.length !== 1 ? 's' : ''}</span>
              {validation.errors.length > 0 && (
                <span className="text-xs text-red-600 ml-2 truncate">
                  Line {validation.errors[0].line}
                </span>
              )}
            </div>
            <button
              onClick={handleFixWithAI}
              disabled={isFixing}
              className={`ml-2 flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${isConfigured
                  ? 'bg-brand-blue text-white hover:bg-blue-600'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                } ${isFixing ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={isConfigured ? 'Fix errors with AI' : 'Configure AI to fix'}
            >
              <Sparkles className="h-3 w-3" />
              {isFixing ? 'Fixing...' : 'Fix'}
            </button>
          </>
        )}
      </div>

      <LLMSettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {/* Editor Area */}
      <div className="flex-grow flex overflow-hidden relative font-mono text-sm">
        {/* Line Numbers */}
        <div className="bg-gray-50 py-4 px-2 text-right text-gray-400 select-none border-r border-gray-100 min-w-[3rem]">
          {lineNumbers}
        </div>

        {/* Text Area */}
        <textarea
          value={currentDiagram.content}
          onChange={(e) => updateDiagramContent(e.target.value)}
          className="flex-grow resize-none p-4 leading-6 focus:outline-none text-gray-700 bg-white w-full h-full font-mono whitespace-pre"
          spellCheck={false}
        />
      </div>
    </aside>
  );
};

export default Editor;
