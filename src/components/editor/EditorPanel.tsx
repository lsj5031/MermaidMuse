import { useCallback, useEffect, useRef } from 'react';
import Editor, { type Monaco } from '@monaco-editor/react';
import { type editor } from 'monaco-editor';
import { useDiagramState, type EditorNavigationApi } from '@hooks/useDiagramState';
import { EDITOR_DEFAULTS } from '@theme/constants';
import { registerMermaidLanguage } from '@utils/mermaidLanguage';

export default function EditorPanel() {
  const { currentDiagram, updateDiagramContent, registerEditorNavigationApi } = useDiagramState();

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const highlightTimeoutRef = useRef<number | null>(null);
  const highlightDecorationIdsRef = useRef<string[]>([]);

  const validation = currentDiagram.validation;

  const updateValidationMarkers = useCallback(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const monaco = monacoRef.current;
    const model = editorRef.current.getModel();
    if (!model) return;

    const markers: editor.IMarkerData[] = [];

    validation.errors.forEach((error) => {
      markers.push({
        severity: monaco.MarkerSeverity.Error,
        message: error.message,
        startLineNumber: error.startLineNumber || error.line,
        startColumn: error.startColumn || error.column,
        endLineNumber: error.endLineNumber || error.line,
        endColumn: error.endColumn || error.column + 1,
        source: 'Mermaid',
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
        source: 'Mermaid',
        code: 'MERMAID_WARNING',
      });
    });

    monaco.editor.setModelMarkers(model, 'mermaid', markers);
  }, [validation]);

  useEffect(() => {
    updateValidationMarkers();
  }, [updateValidationMarkers]);

  useEffect(() => {
    const api: EditorNavigationApi = {
      revealPosition: (lineNumber: number, column: number = 1) => {
        if (!editorRef.current || !monacoRef.current) return;

        const editorInstance = editorRef.current;
        const monaco = monacoRef.current;

        editorInstance.focus();
        editorInstance.setPosition({ lineNumber, column });
        editorInstance.revealPositionInCenter({ lineNumber, column });

        const model = editorInstance.getModel();
        if (!model) return;

        if (highlightTimeoutRef.current) {
          window.clearTimeout(highlightTimeoutRef.current);
        }

        highlightDecorationIdsRef.current = editorInstance.deltaDecorations(
          highlightDecorationIdsRef.current,
          [
            {
              range: new monaco.Range(
                lineNumber,
                1,
                lineNumber,
                model.getLineMaxColumn(lineNumber)
              ),
              options: {
                isWholeLine: true,
                className: 'editor-error-line-highlight',
              },
            },
          ]
        );

        highlightTimeoutRef.current = window.setTimeout(() => {
          if (!editorRef.current) return;
          highlightDecorationIdsRef.current = editorRef.current.deltaDecorations(
            highlightDecorationIdsRef.current,
            []
          );
        }, 2500);
      },
    };

    registerEditorNavigationApi(api);

    return () => {
      registerEditorNavigationApi(null);
      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, [registerEditorNavigationApi]);

  const handleEditorDidMount = (instance: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = instance;
    monacoRef.current = monaco;

    registerMermaidLanguage();

    updateValidationMarkers();
  };

  return (
    <div className="h-full flex flex-col bg-dark-bg">
      <div className="flex-1">
        <Editor
          language="mermaid"
          value={currentDiagram.content}
          onChange={(value) => updateDiagramContent(value || '')}
          onMount={handleEditorDidMount}
          theme="mermaid-dark"
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
                <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                Loading editor...
              </div>
            </div>
          }
          beforeMount={(monaco) => {
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
