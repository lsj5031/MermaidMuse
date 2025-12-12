import type { MermaidConfig } from 'mermaid';

export type DiagramTheme = 'light' | 'dark' | 'cyber';

export interface ThreePalette {
  background: string;
  backgroundGradient: [string, string];
  edgeColor: string;
  nodeColors: string[];
  ambientLight: { color: number; intensity: number };
  keyLight: { color: number; intensity: number; position: [number, number, number] };
  accentLight1: { color: number; intensity: number; position: [number, number, number] };
  accentLight2: { color: number; intensity: number; position: [number, number, number] };
}

export interface DiagramThemeConfig {
  label: string;
  mermaid: MermaidConfig;
  three: ThreePalette;
}

export const DIAGRAM_THEME_CONFIG: Record<DiagramTheme, DiagramThemeConfig> = {
  light: {
    label: 'Light',
    mermaid: {
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
    },
    three: {
      background: '#ffffff',
      backgroundGradient: ['#ffffff', '#f1f5f9'],
      edgeColor: '#0f172a',
      nodeColors: ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0ea5e9'],
      ambientLight: { color: 0xffffff, intensity: 0.7 },
      keyLight: { color: 0xffffff, intensity: 1.0, position: [10, 10, 8] },
      accentLight1: { color: 0x2563eb, intensity: 0.25, position: [-10, 0, 10] },
      accentLight2: { color: 0x7c3aed, intensity: 0.2, position: [0, -10, -5] },
    },
  },
  dark: {
    label: 'Dark',
    mermaid: {
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
    },
    three: {
      background: '#0b1220',
      backgroundGradient: ['#0b1220', '#111827'],
      edgeColor: '#60a5fa',
      nodeColors: ['#60a5fa', '#a78bfa', '#34d399', '#fbbf24', '#f87171', '#38bdf8'],
      ambientLight: { color: 0x404040, intensity: 0.6 },
      keyLight: { color: 0xffffff, intensity: 1.0, position: [10, 10, 5] },
      accentLight1: { color: 0x60a5fa, intensity: 0.35, position: [-10, 0, 10] },
      accentLight2: { color: 0xa78bfa, intensity: 0.25, position: [0, -10, -5] },
    },
  },
  cyber: {
    label: 'Cyber',
    mermaid: {
      startOnLoad: false,
      theme: 'base',
      securityLevel: 'loose',
      themeVariables: {
        fontFamily: '"Comic Neue", system-ui, -apple-system, sans-serif',
        primaryColor: '#1a1f3a',
        primaryTextColor: '#e0e0ff',
        primaryBorderColor: '#00f5ff',
        lineColor: '#00f5ff',
        secondaryColor: '#ff006e',
        tertiaryColor: '#252d4a',
        noteBkgColor: '#252d4a',
        noteTextColor: '#e0e0ff',
        actorBkg: '#1a1f3a',
        actorBorder: '#00f5ff',
      },
    },
    three: {
      background: '#0a0e27',
      backgroundGradient: ['#0a0e27', '#1a1f3a'],
      edgeColor: '#00f5ff',
      nodeColors: ['#ff006e', '#00f5ff', '#b537f2', '#39ff14', '#fffd38', '#0080ff'],
      ambientLight: { color: 0x404040, intensity: 0.6 },
      keyLight: { color: 0xffffff, intensity: 1.0, position: [10, 10, 5] },
      accentLight1: { color: 0x00f5ff, intensity: 0.5, position: [-10, 0, 10] },
      accentLight2: { color: 0xb537f2, intensity: 0.3, position: [0, -10, -5] },
    },
  },
};

export const getMermaidConfigForTheme = (theme: DiagramTheme): MermaidConfig => {
  return DIAGRAM_THEME_CONFIG[theme].mermaid;
};

export const getNodeColorForTheme = (theme: DiagramTheme, nodeId: string): string => {
  const palette = DIAGRAM_THEME_CONFIG[theme].three.nodeColors;

  let hash = 0;
  for (let i = 0; i < nodeId.length; i++) {
    hash = nodeId.charCodeAt(i) + ((hash << 5) - hash);
  }

  return palette[Math.abs(hash) % palette.length];
};
