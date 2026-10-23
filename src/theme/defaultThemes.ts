import { registerTheme } from './themeRegistry';

export function initializeDefaultThemes(): void {
  registerTheme('avocado', {
    label: 'Avocado',
    colors: {
      background: '#FCFBF5',
      foreground: '#2d2d2d',
      line: '#2d2d2d',
      surface: '#E6F7E5',
      alternate: '#ffffff',
    },
  });
  registerTheme('kanagawa', {
    label: 'Kanagawa',
    colors: {
      background: '#1F1F28',
      foreground: '#DCD7BA',
      line: '#7E9CD8',
      surface: '#2A2A37',
      alternate: '#363646',
    },
  });
  registerTheme('dracula', {
    label: 'Dracula',
    colors: {
      background: '#282A36',
      foreground: '#F8F8F2',
      line: '#8BE9FD',
      surface: '#44475A',
      alternate: '#383A59',
    },
  });
  registerTheme('solarized', {
    label: 'Solarized Light',
    colors: {
      background: '#fdf6e3',
      foreground: '#657b83',
      line: '#268BD2',
      surface: '#eee8d5',
      alternate: '#fdf6e3',
    },
  });
}
