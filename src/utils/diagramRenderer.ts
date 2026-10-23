import { render } from 'pele';
import { getTheme, type DiagramTheme } from '@theme/themeRegistry';

// A system font keeps preview and standalone images independent of network-loaded fonts.
export const DIAGRAM_FONT = 'Arial, sans-serif';

export function renderDiagram(content: string, theme: DiagramTheme = 'avocado') {
  const result = render(content, {
    fontFamily: DIAGRAM_FONT,
    fontFamilyMono: 'monospace',
    responsive: false,
    idPrefix: 'muse',
    // Shared diagrams never navigate or fetch external images. No raw icon/math resolvers.
    links: false,
    images: false,
  });
  const colors = getTheme(theme)?.colors ?? {
    background: '#FCFBF5',
    foreground: '#2d2d2d',
    line: '#2d2d2d',
    surface: '#E6F7E5',
    alternate: '#ffffff',
  };
  const doc = new DOMParser().parseFromString(result.svg, 'image/svg+xml');
  const svg = doc.documentElement;
  const variables: Record<string, string> = {
    bg: colors.background,
    fg: colors.foreground,
    muted: colors.foreground,
    line: colors.line,
    border: colors.line,
    accent: colors.line,
    surface: colors.surface,
    'surface-alt': colors.alternate,
    font: DIAGRAM_FONT,
  };
  // Carry theme values inside the SVG, including when opened outside the app.
  const style = Object.entries(variables)
    .map(([key, value]) => '--pele-' + key + ':' + value)
    .join(';');
  svg.setAttribute('style', (svg.getAttribute('style') ?? '') + ';' + style);
  // Pele's root is transparent. Keep --pele-bg opaque for label/shape fills,
  // but never paint a full-canvas rectangle in preview or standalone exports.
  return { ...result, svg: new XMLSerializer().serializeToString(svg) };
}
