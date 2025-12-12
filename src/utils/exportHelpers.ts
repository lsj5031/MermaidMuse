import html2canvas from 'html2canvas';
import mermaid from 'mermaid';
import { getMermaidConfigForTheme, type DiagramTheme } from '@theme/diagramThemes';

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
};

export interface ExportPngOptions {
  backgroundColor?: string;
  scale?: number;
  watermarkText?: string;
  watermarkColor?: string;
}

export async function exportElementAsPNG(element: HTMLElement, filename: string, options: ExportPngOptions = {}) {
  const { backgroundColor = '#0a0e27', scale = 2, watermarkText, watermarkColor } = options;

  const canvas = await html2canvas(element, {
    backgroundColor,
    scale,
    useCORS: true,
  });

  if (watermarkText) {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const padding = Math.round(18 * scale);
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = watermarkColor ?? '#ffffff';
      ctx.font = `${Math.round(14 * scale)}px "Comic Neue", system-ui, -apple-system, sans-serif`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(watermarkText, canvas.width - padding, canvas.height - padding);
      ctx.restore();
    }
  }

  downloadBlob(canvasToBlob(canvas), `${filename}.png`);
}

export async function exportElementAsPNGById(elementId: string, filename: string, options?: ExportPngOptions) {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id ${elementId} not found`);
  }

  await exportElementAsPNG(element, filename, options);
}

export async function exportDiagramAsPNG(elementId: string, filename: string): Promise<void> {
  await exportElementAsPNGById(elementId, filename, {
    backgroundColor: '#0a0e27',
    scale: 2,
  });
}

const canvasToBlob = (canvas: HTMLCanvasElement): Blob => {
  const dataUrl = canvas.toDataURL('image/png');
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/data:(.*);base64/)?.[1] ?? 'image/png';
  const byteCharacters = atob(data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mime });
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
    text.setAttribute('opacity', '0.55');
    text.setAttribute(
      'style',
      'font-family: "Comic Neue", system-ui, -apple-system, sans-serif; font-size: 12px; paint-order: stroke; stroke: rgba(0,0,0,0.35); stroke-width: 3px;'
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
  theme: DiagramTheme,
  options: ExportSvgOptions = {}
): Promise<void> {
  const { watermarkText = 'Diagram Studio', watermarkColor } = options;

  mermaid.initialize(getMermaidConfigForTheme(theme));

  const { svg } = await mermaid.mermaidAPI.render(`export-${Date.now()}`, content);

  const colored = addSvgWatermark(
    svg,
    watermarkText,
    watermarkColor ?? (theme === 'light' ? '#0f172a' : '#ffffff')
  );

  downloadBlob(new Blob([colored], { type: 'image/svg+xml;charset=utf-8' }), `${filename}.svg`);
}

export function exportDiagramAsJSON(content: string, filename: string): void {
  const dataStr = JSON.stringify({ content }, null, 2);
  downloadBlob(new Blob([dataStr], { type: 'application/json' }), `${filename}.json`);
}

export function exportDiagramAsText(content: string, filename: string): void {
  downloadBlob(new Blob([content], { type: 'text/plain' }), `${filename}.mmd`);
}
