export interface DiagramState {
  id: string;
  title: string;
  content: string;
  type: string;
  lastModified: Date;
}

export interface ExportOptions {
  format: 'png' | 'json' | 'mmd';
  filename: string;
}

export type DiagramType =
  | 'flowchart'
  | 'sequenceDiagram'
  | 'classDiagram'
  | 'stateDiagram'
  | 'erDiagram'
  | 'gantt'
  | 'pie';

export interface ThemeConfig {
  colors: Record<string, string>;
  shadows: Record<string, string>;
  transitions: Record<string, string>;
}
