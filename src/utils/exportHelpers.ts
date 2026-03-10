import mermaid from 'mermaid';
import type { DiagramTheme } from '@theme/themeRegistry';

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export interface ExportSvgOptions {
  watermarkText?: string;
  watermarkColor?: string;
}

const addSvgWatermark = (svg: string, watermarkText: string, watermarkColor: string) => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');
    const svgEl = doc.documentElement;
    const ns = 'http://www.w3.org/2000/svg';

    const group = doc.createElementNS(ns, 'g');
    group.setAttribute('pointer-events', 'none');

    const text = doc.createElementNS(ns, 'text');
    text.textContent = watermarkText;
    text.setAttribute('x', '99%');
    text.setAttribute('y', '99%');
    text.setAttribute('text-anchor', 'end');
    text.setAttribute('dominant-baseline', 'auto');
    text.setAttribute('fill', watermarkColor);
    text.setAttribute('opacity', '0.85');
    text.setAttribute(
      'style',
      'font-family: "Comic Neue", system-ui, -apple-system, sans-serif; font-size: 14px; font-weight: bold; paint-order: stroke; stroke: rgba(255,255,255,0.6); stroke-width: 0.5px;'
    );

    group.appendChild(text);
    svgEl.appendChild(group);

    return new XMLSerializer().serializeToString(doc);
  } catch {
    return svg;
  }
};

export async function exportMermaidAsSVG(
  content: string,
  filename: string,
  options: ExportSvgOptions = {},
  _theme: DiagramTheme = 'cyber'
): Promise<void> {
  const { watermarkText = 'MermaidMuse', watermarkColor } = options;

  mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    themeVariables: {
      fontFamily: 'Comic Neue',
      fontSize: '16px',
      primaryColor: '#E6F7E5',
      primaryBorderColor: '#2d2d2d',
      primaryTextColor: '#2d2d2d',
      lineColor: '#2d2d2d',
      secondaryColor: '#FCFBF5',
      tertiaryColor: '#fff',
    },
    securityLevel: 'loose',
  });

  const { svg } = await mermaid.mermaidAPI.render(`export-${Date.now()}`, content);

  const colored = addSvgWatermark(
    svg,
    watermarkText,
    watermarkColor ?? '#2d2d2d'
  );

  downloadBlob(new Blob([colored], { type: 'image/svg+xml;charset=utf-8' }), `${filename}.svg`);
}
