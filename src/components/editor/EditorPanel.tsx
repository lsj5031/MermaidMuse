import Editor from '@monaco-editor/react';
import { useDiagramState } from '@hooks/useDiagramState';
import { EDITOR_DEFAULTS } from '@theme/constants';

export default function EditorPanel() {
  const { currentDiagram, updateDiagramContent } = useDiagramState();

  return (
    <div className="h-full flex flex-col bg-dark-bg">
      <div className="flex-1">
        <Editor
          language="mermaid"
          value={currentDiagram.content}
          onChange={(value) => updateDiagramContent(value || '')}
          theme="vs-dark"
          options={{
            ...EDITOR_DEFAULTS,
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            wrappingIndent: 'indent',
          }}
          loading={
            <div className="flex items-center justify-center h-full text-gray-400">
              Loading editor...
            </div>
          }
        />
      </div>
    </div>
  );
}
