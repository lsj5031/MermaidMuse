import React, { useRef, useEffect } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { useDiagramState } from '@hooks/useDiagramState';
import { EDITOR_DEFAULTS } from '@theme/constants';
import { ValidationError } from '@utils/validation';
import { registerMermaidLanguage } from '@utils/mermaidLanguage';

export default function EditorPanel() {
  const { currentDiagram, updateDiagramContent } = useDiagramState();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Configure Monaco for Mermaid
    monaco.languages.register({ id: 'mermaid' });
    
    // Set up Monaco validation markers when validation results change
    updateValidationMarkers();
  };

  const updateValidationMarkers = () => {
    if (!editorRef.current || !monacoRef.current) return;

    const { validation } = currentDiagram;
    const monaco = monacoRef.current;
    const editor = editorRef.current;

    // Clear existing markers
    monaco.editor.setModelMarkers(editor.getModel()!, 'mermaid', []);

    if (!validation.isValid || validation.errors.length > 0 || validation.warnings.length > 0) {
      const markers: editor.IMarkerData[] = [];

      validation.errors.forEach((error) => {
        markers.push({
          severity: monaco.MarkerSeverity.Error,
          message: error.message,
          startLineNumber: error.startLineNumber || error.line,
          startColumn: error.startColumn || error.column,
          endLineNumber: error.endLineNumber || error.line,
          endColumn: error.endColumn || error.column + 1,
          source: 'Mermaid Parser',
          code: 'MERMAID_ERROR',
        });
      });

      validation.warnings.forEach((warning) => {
        markers.push({
          severity: monaco.MarkerSeverity.Warning,
          message: warning.message,
          startLineNumber: warning.startLineNumber || warning.line,
          startColumn: warning.startColumn || warning.column,
          endLineNumber: warning.endLineNumber || warning.line,
          endColumn: warning.endColumn || warning.column + 1,
          source: 'Mermaid Parser',
          code: 'MERMAID_WARNING',
        });
      });

      // Apply markers to the editor
      monaco.editor.setModelMarkers(editor.getModel()!, 'mermaid', markers);
    }
  };

  // Update markers when validation changes
  useEffect(() => {
    updateValidationMarkers();
  }, [currentDiagram.validation]);

  return (
    <div className="h-full flex flex-col bg-dark-bg">
      <div className="flex-1">
        <Editor
          language="mermaid"
          value={currentDiagram.content}
          onChange={(value) => updateDiagramContent(value || '')}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            ...EDITOR_DEFAULTS,
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            wrappingIndent: 'indent',
            glyphMargin: true,
            folding: true,
            lineDecorationsWidth: 20,
            lineNumbersMinChars: 3,
            renderLineHighlight: 'all',
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            selectOnLineNumbers: true,
            roundedSelection: false,
            readOnly: false,
          }}
          loading={
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                Loading editor...
              </div>
            </div>
          }
          beforeMount={(monaco) => {
            // Configure Monaco editor before mount
            monaco.editor.defineTheme('mermaid-dark', {
              base: 'vs-dark',
              inherit: true,
              rules: [
                { token: 'keyword', foreground: 'ff006e' },
                { token: 'identifier', foreground: '00f5ff' },
                { token: 'string', foreground: '39ff14' },
                { token: 'number', foreground: 'b537f2' },
              ],
              colors: {
                'editor.background': '#0a0e27',
                'editor.foreground': '#ffffff',
                'editorLineNumber.foreground': '#4a5568',
                'editorLineNumber.activeForeground': '#00f5ff',
                'editor.selectionBackground': '#ff006e40',
                'editor.inactiveSelectionBackground': '#ff006e20',
              },
            });
          }}
        />
      </div>
    </div>
  );
}
