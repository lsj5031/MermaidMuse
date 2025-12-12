import { registerTheme, type DiagramThemeConfig } from './themeRegistry';

/**
 * Default built-in themes for MermaidMuse
 */

const lightTheme: DiagramThemeConfig = {
  label: 'Light',
  mermaid: {
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
  },
};

const darkTheme: DiagramThemeConfig = {
  label: 'Dark',
  mermaid: {
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
  },
};

const cyberTheme: DiagramThemeConfig = {
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
};

/**
 * Initialize default themes
 */
export function initializeDefaultThemes(): void {
  registerTheme('light', lightTheme);
  registerTheme('dark', darkTheme);
  registerTheme('cyber', cyberTheme);
}
