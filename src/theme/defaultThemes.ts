import { registerTheme, type DiagramThemeConfig } from './themeRegistry';

/**
 * Default built-in themes for MermaidMuse
 */

const avocadoTheme: DiagramThemeConfig = {
  label: 'Avocado',
  mermaid: {
    startOnLoad: false,
    // Matches the pre-theme-switcher preview defaults.
    theme: 'base',
    securityLevel: 'loose',
    themeVariables: {
      fontFamily: '"Comic Neue", system-ui, -apple-system, sans-serif',
      fontSize: '16px',
      primaryColor: '#E6F7E5',
      primaryBorderColor: '#2d2d2d',
      primaryTextColor: '#2d2d2d',
      lineColor: '#2d2d2d',
      secondaryColor: '#FCFBF5',
      tertiaryColor: '#fff',
    },
  },
};

const kanagawaTheme: DiagramThemeConfig = {
  label: 'Kanagawa',
  mermaid: {
    startOnLoad: false,
    theme: 'base',
    securityLevel: 'loose',
    themeVariables: {
      primaryColor: '#1F1F28',
      primaryTextColor: '#DCD7BA',
      primaryBorderColor: '#7E9CD8',
      lineColor: '#7E9CD8',
      secondaryColor: '#2A2A37',
      tertiaryColor: '#363646',
      noteBkgColor: '#2A2A37',
      noteTextColor: '#DCD7BA',
      actorBkg: '#1F1F28',
      actorBorder: '#7E9CD8',
      fontFamily: '"Comic Neue", system-ui, -apple-system, sans-serif',
    },
  },
};

const draculaTheme: DiagramThemeConfig = {
  label: 'Dracula',
  mermaid: {
    startOnLoad: false,
    theme: 'base',
    securityLevel: 'loose',
    themeVariables: {
      primaryColor: '#282A36',
      primaryTextColor: '#F8F8F2',
      primaryBorderColor: '#8BE9FD',
      lineColor: '#8BE9FD',
      secondaryColor: '#44475A',
      tertiaryColor: '#44475A',
      noteBkgColor: '#44475A',
      noteTextColor: '#F8F8F2',
      actorBkg: '#282A36',
      actorBorder: '#8BE9FD',
      fontFamily: '"Comic Neue", system-ui, -apple-system, sans-serif',
    },
  },
};

const solarizedTheme: DiagramThemeConfig = {
  label: 'Solarized Light',
  mermaid: {
    startOnLoad: false,
    theme: 'base',
    securityLevel: 'loose',
    themeVariables: {
      // Solarized Light palette
      primaryColor: '#fdf6e3',
      primaryTextColor: '#657b83',
      primaryBorderColor: '#268BD2',
      lineColor: '#268BD2',
      secondaryColor: '#eee8d5',
      tertiaryColor: '#eee8d5',
      noteBkgColor: '#eee8d5',
      noteTextColor: '#657b83',
      actorBkg: '#fdf6e3',
      actorBorder: '#268BD2',
      fontFamily: '"Comic Neue", system-ui, -apple-system, sans-serif',
    },
  },
};

/**
 * Initialize default themes
 */
export function initializeDefaultThemes(): void {
  registerTheme('avocado', avocadoTheme);
  registerTheme('kanagawa', kanagawaTheme);
  registerTheme('dracula', draculaTheme);
  registerTheme('solarized', solarizedTheme);
}
