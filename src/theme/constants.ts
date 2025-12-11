export const SAMPLE_MERMAID_DIAGRAM = `graph TD
    A[Start: User Request] --> B{Check<br/>Authentication}
    B -->|Authenticated| C[Load Diagram]
    B -->|Not Auth| D[Show Login]
    C --> E[Render Canvas]
    E --> F{User<br/>Action}
    F -->|Edit| G[Update Diagram]
    F -->|Export| H[Download File]
    F -->|Share| I[Generate Link]
    G --> E
    H --> J[End]
    I --> J
    D --> J`;

export const EDITOR_DEFAULTS = {
  fontSize: 14,
  fontFamily: 'Fira Code',
  theme: 'vs-dark',
  minimap: { enabled: true },
  automaticLayout: true,
};

export const DIAGRAM_TYPES = {
  FLOWCHART: 'flowchart',
  SEQUENCE: 'sequenceDiagram',
  CLASS: 'classDiagram',
  STATE: 'stateDiagram',
  ER: 'erDiagram',
  GANTT: 'gantt',
  PIE: 'pie title',
} as const;

export const SIDEBAR_WIDTH = 256;
export const HEADER_HEIGHT = 64;
