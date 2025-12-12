import { languages } from 'monaco-editor';

const monarchLanguage: languages.IMonarchLanguage = {
  tokenizer: {
    root: [
      [
        /\b(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|title|subgraph|end|class|interface|enum|note|participant|actor|loop|alt|opt|par|and|break|merge)\b/,
        'keyword',
      ],
      [/\b(A[A-Z]\w*|[A-Z][A-Z0-9_]*)\b/, 'type.identifier'],
      [/\b(\w+)\s*-->/, 'operator'],
      [/\b(\w+)\s*-->\|/, 'operator'],
      [/\b(\w+)\s*-\.-?>/, 'operator'],
      [/\b(\w+)\s*==>/, 'operator'],
      [/\b(\w+)\s*--\|\|>/, 'operator'],
      [/\b(\w+)\s*\[\[/, 'string'],
      [/\]\]/, 'string'],
      [/[{}]/, 'delimiter.bracket'],
      [/(\w+):/, 'string'],
      [/".*?"/, 'string'],
      [/'.*?'/, 'string'],
      [/\d+/, 'number'],
      [/%%.*$/, 'comment'],
      [/-->|<--|==>|==|---|___|===|\|\|\|--?>/, 'operator'],
    ],
  },
};

const languageConfiguration: languages.LanguageConfiguration = {
  comments: {
    lineComment: '%%',
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')'],
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
};

export const mermaidLanguageConfig = {
  id: 'mermaid',
  extensions: ['.mmd', '.mermaid'],
  aliases: ['mermaid', 'mmd'],
  mimetypes: ['text/plain'],
  tokenizer: monarchLanguage.tokenizer,
  configuration: languageConfiguration,
};

export const registerMermaidLanguage = () => {
  languages.register({ id: mermaidLanguageConfig.id });
  languages.setMonarchTokensProvider(mermaidLanguageConfig.id, monarchLanguage);
  languages.setLanguageConfiguration(mermaidLanguageConfig.id, languageConfiguration);
};

export default mermaidLanguageConfig;
