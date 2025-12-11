import { languages } from 'monaco-editor';

// Define Mermaid language configuration
export const mermaidLanguageConfig = {
  id: 'mermaid',
  extensions: ['.mmd', '.mermaid'],
  aliases: ['mermaid', 'mmd'],
  mimetypes: ['text/plain'],
  // Monaco tokenization rules for Mermaid
  tokenizer: {
    root: [
      [/\b(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|title|subgraph|end|class|interface|enum|note|participant|actor|loop|alt|opt|par|and|break|merge)\b/, 'keyword'],
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
    ]
  },
  // Language configuration for Monaco
  configuration: {
    comments: {
      lineComment: '%%',
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')']
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" }
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" }
    ]
  }
};

// Register Mermaid language in Monaco
export const registerMermaidLanguage = () => {
  // Register the language
  languages.register({ id: mermaidLanguageConfig.id });

  // Set language configuration
  try {
    // Set monarch tokenizer
    (languages as any).setMonarchTokensProvider(mermaidLanguageConfig.id, mermaidLanguageConfig.tokenizer);
    
    // Set language configuration
    (languages as any).setLanguageConfiguration(mermaidLanguageConfig.id, mermaidLanguageConfig.configuration);
  } catch (error) {
    console.warn('Failed to register Mermaid language features:', error);
  }
};

export default mermaidLanguageConfig;