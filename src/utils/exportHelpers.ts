import { renderDiagram, DIAGRAM_FONT } from './diagramRenderer';
import { getTheme, type DiagramTheme } from '@theme/themeRegistry';

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export interface ExportSvgOptions {
  watermarkText?: string;
  watermarkColor?: string;
}

export function createExportSvg(
  content: string,
  options: ExportSvgOptions = {},
  theme: DiagramTheme = 'avocado'
) {
  const result = renderDiagram(content, theme);
  const doc = new DOMParser().parseFromString(result.svg, 'image/svg+xml');
  const svg = doc.documentElement;
  const {
    watermarkText = 'MermaidMuse',
    watermarkColor = getTheme(theme)?.colors.foreground ?? '#2d2d2d',
  } = options;
  if (watermarkText) {
    // Reserve a footer wide enough for the watermark, including narrow diagrams.
    const context = document.createElement('canvas').getContext('2d');
    if (context) context.font = '12px ' + DIAGRAM_FONT;
    const textWidth = context?.measureText(watermarkText).width ?? watermarkText.length * 12;
    const width = Math.max(result.width, Math.ceil(textWidth) + 16);
    const height = result.height + 28;
    svg.setAttribute('width', String(width));
    svg.setAttribute('height', String(height));
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    const text = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.textContent = watermarkText;
    text.setAttribute('x', String(width - 8));
    text.setAttribute('y', String(height - 8));
    text.setAttribute('text-anchor', 'end');
    text.setAttribute('fill', watermarkColor);
    text.setAttribute('font-family', DIAGRAM_FONT);
    text.setAttribute('font-size', '12');
    svg.appendChild(text);
    result.width = width;
    result.height = height;
  }
  return { ...result, svg: new XMLSerializer().serializeToString(svg) };
}

export async function exportMermaidAsSVG(
  content: string,
  filename: string,
  options: ExportSvgOptions = {},
  theme: DiagramTheme = 'avocado'
): Promise<void> {
  const { svg } = createExportSvg(content, options, theme);
  downloadBlob(
    new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }),
    (filename || 'diagram') + '.svg'
  );
}

export async function exportMermaidAsPNG(
  content: string,
  filename: string,
  options: ExportSvgOptions = {},
  theme: DiagramTheme = 'avocado'
): Promise<void> {
  const { svg, width, height } = createExportSvg(content, options, theme);
  const scale = 2;
  if (width * height * scale * scale > 32_000_000 || Math.max(width, height) * scale > 16384) {
    throw new Error('Diagram too large for PNG; use SVG instead.');
  }
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(width * scale);
    canvas.height = Math.ceil(height * scale);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is unavailable');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (value) => (value ? resolve(value) : reject(new Error('PNG encoding failed'))),
        'image/png'
      );
    });
    downloadBlob(blob, (filename || 'diagram') + '.png');
  } finally {
    URL.revokeObjectURL(url);
  }
}
