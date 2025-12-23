import mermaid from 'mermaid';
import html2canvas from 'html2canvas';
import type { DiagramTheme } from '@theme/themeRegistry';

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
  padding?: number;
}

export interface ExportSvgOptions {
  watermarkText?: string;
  watermarkColor?: string;
  padding?: number;
}

/**
 * Parses the viewBox attribute from an SVG element
 */
const parseViewBox = (
  svgEl: SVGSVGElement
): { x: number; y: number; width: number; height: number } | null => {
  const viewBox = svgEl.getAttribute('viewBox');
  if (viewBox) {
    const parts = viewBox.split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts.every((n) => !isNaN(n))) {
      return { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
    }
  }
  // Fall back to width/height attributes
  const width = parseFloat(svgEl.getAttribute('width') || '0');
  const height = parseFloat(svgEl.getAttribute('height') || '0');
  if (width > 0 && height > 0) {
    return { x: 0, y: 0, width, height };
  }
  return null;
};

/**
 * Adds padding to an SVG by adjusting the viewBox and dimensions
 */
const addSvgPadding = (svgString: string, padding: number): string => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const svgEl = doc.documentElement as unknown as SVGSVGElement;

    const viewBox = parseViewBox(svgEl);
    if (viewBox) {
      // Expand viewBox by padding on all sides
      const newViewBox = `${viewBox.x - padding} ${viewBox.y - padding} ${viewBox.width + padding * 2} ${viewBox.height + padding * 2}`;
      svgEl.setAttribute('viewBox', newViewBox);

      // Also update width/height if they exist as absolute values
      const widthAttr = svgEl.getAttribute('width');
      const heightAttr = svgEl.getAttribute('height');

      if (widthAttr && !widthAttr.includes('%')) {
        const widthVal = parseFloat(widthAttr);
        if (!isNaN(widthVal)) {
          svgEl.setAttribute('width', `${widthVal + padding * 2}`);
        }
      }
      if (heightAttr && !heightAttr.includes('%')) {
        const heightVal = parseFloat(heightAttr);
        if (!isNaN(heightVal)) {
          svgEl.setAttribute('height', `${heightVal + padding * 2}`);
        }
      }
    }

    return new XMLSerializer().serializeToString(doc);
  } catch {
    return svgString;
  }
};

/**
 * Ensures all required SVG namespace declarations are present
 * This fixes "Namespace prefix xlink for href is not defined" errors
 */
/**
 * Ensures all required SVG namespace declarations are present
 * This fixes "Namespace prefix xlink for href is not defined" errors
 * implementations uses string checking to avoid "Attribute xmlns redefined" errors
 */
const ensureSvgNamespaces = (svgString: string): string => {
  let newSvg = svgString;

  // Add xmlns if missing
  if (!newSvg.match(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
    newSvg = newSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  // Add xlink namespace if missing but used
  if (!newSvg.match(/xmlns:xlink="http:\/\/www\.w3\.org\/1999\/xlink"/)) {
    newSvg = newSvg.replace('<svg', '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  }

  // Add xml namespace if missing (sometimes needed for xml:space)
  if (
    newSvg.includes('xml:space') &&
    !newSvg.match(/xmlns:xml="http:\/\/www\.w3\.org\/XML\/1998\/namespace"/)
  ) {
    newSvg = newSvg.replace('<svg', '<svg xmlns:xml="http://www.w3.org/XML/1998/namespace"');
  }

  return newSvg;
};

/**
 * Adds a watermark to an SVG
 */
const addSvgWatermark = (svg: string, watermarkText: string, watermarkColor: string) => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');
    const svgEl = doc.documentElement as unknown as SVGSVGElement;
    const ns = 'http://www.w3.org/2000/svg';

    // Get the viewBox to position watermark correctly
    const viewBox = parseViewBox(svgEl);

    const group = doc.createElementNS(ns, 'g');
    group.setAttribute('pointer-events', 'none');

    const text = doc.createElementNS(ns, 'text');
    text.textContent = watermarkText;

    if (viewBox) {
      // Position watermark at bottom-right of viewBox
      text.setAttribute('x', `${viewBox.x + viewBox.width - 10}`);
      text.setAttribute('y', `${viewBox.y + viewBox.height - 10}`);
    } else {
      // Fall back to percentage positioning
      text.setAttribute('x', '99%');
      text.setAttribute('y', '99%');
    }

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

/**
 * Renders mermaid content to SVG with consistent styling
 */
import { getMermaidConfigForTheme } from '@theme/themeRegistry';

/**
 * Renders mermaid content to SVG with consistent styling
 */
const renderMermaidToSvg = async (
  content: string,
  theme: DiagramTheme = 'cyber'
): Promise<string> => {
  const themeConfig = getMermaidConfigForTheme(theme);

  if (themeConfig) {
    mermaid.initialize({
      startOnLoad: false,
      ...themeConfig,
      securityLevel: 'loose',
    });
  } else {
    // Fallback to base theme if not found
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
  }

  const { svg } = await mermaid.mermaidAPI.render(`export-${Date.now()}`, content);
  return svg;
};

/**
 * Helper to convert SVG string to PNG blob using html2canvas
 * This skips the "tainted canvas" security issue with native drawImage and foreignObjects
 */
const svgToPngBlobHtml2Canvas = async (
  svgString: string,
  options: {
    scale?: number;
    backgroundColor?: string;
    watermarkText?: string;
    watermarkColor?: string;
  }
): Promise<Blob> => {
  const { scale = 4, backgroundColor = '#ffffff', watermarkText, watermarkColor } = options;

  // Create a temporary container
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.innerHTML = svgString;
  document.body.appendChild(container);

  const svgEl = container.querySelector('svg');
  if (!svgEl) {
    document.body.removeChild(container);
    throw new Error('SVG extraction failed');
  }

  // Ensure dimensions are explicit for html2canvas to capture it cleanly
  const viewBox = parseViewBox(svgEl);
  if (viewBox) {
    svgEl.setAttribute('width', `${viewBox.width}`);
    svgEl.setAttribute('height', `${viewBox.height}`);
  }

  // Use html2canvas to render
  try {
    const canvas = await html2canvas(container, {
      backgroundColor,
      scale, // High resolution scale
      logging: false,
      useCORS: true, // Allow loading cross-origin images/fonts if possible
      onclone: (clonedDoc) => {
        // Optional: add watermark to the cloned DOM before render
        if (watermarkText) {
          const clonedContainer = clonedDoc.body.lastChild as HTMLElement;
          const clonedSvg = clonedContainer.querySelector('svg');
          if (clonedSvg) {
            // We can reuse the addSvgWatermark logic or inject it here
            // Since we already have the SVG logic, simpler to do it before rendering
          }
        }
      },
    });

    if (watermarkText) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const padding = Math.round(20 * scale);
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = watermarkColor ?? '#2d2d2d';
        ctx.font = `bold ${Math.round(14 * scale)}px "Comic Neue", system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = Math.round(2 * scale);
        ctx.strokeText(watermarkText, canvas.width - padding, canvas.height - padding);
        ctx.fillText(watermarkText, canvas.width - padding, canvas.height - padding);
        ctx.restore();
      }
    }

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas to Blob failed'));
      }, 'image/png');
    });
  } finally {
    document.body.removeChild(container);
  }
};

/**
 * Exports mermaid content as a high-quality PNG
 */
export async function exportMermaidAsPNG(
  content: string,
  filename: string,
  options: ExportPngOptions = {},
  theme: DiagramTheme = 'cyber'
): Promise<void> {
  const {
    backgroundColor = '#ffffff',
    scale = 4,
    watermarkText = 'MermaidMuse',
    watermarkColor = '#2d2d2d',
    padding = 40,
  } = options;

  // Render mermaid to SVG
  let svg = await renderMermaidToSvg(content, theme);

  // Add namespaces and padding
  svg = ensureSvgNamespaces(svg);
  svg = addSvgPadding(svg, padding);

  // Convert to PNG via html2canvas
  const blob = await svgToPngBlobHtml2Canvas(svg, {
    scale,
    backgroundColor,
    watermarkText,
    watermarkColor,
  });

  downloadBlob(blob, `${filename}.png`);
}

/**
 * Exports the currently displayed SVG element as PNG
 */
export async function exportDisplayedSvgAsPNG(
  svgElement: SVGSVGElement | null,
  filename: string,
  options: ExportPngOptions = {}
): Promise<void> {
  if (!svgElement) {
    throw new Error('No SVG element provided');
  }

  const {
    backgroundColor = '#ffffff',
    scale = 4,
    watermarkText = 'MermaidMuse',
    watermarkColor = '#2d2d2d',
    padding = 40,
  } = options;

  const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
  let svgString = new XMLSerializer().serializeToString(svgClone);

  // Add namespaces and padding
  svgString = ensureSvgNamespaces(svgString);
  svgString = addSvgPadding(svgString, padding);

  // Convert to PNG via html2canvas
  const blob = await svgToPngBlobHtml2Canvas(svgString, {
    scale,
    backgroundColor,
    watermarkText,
    watermarkColor,
  });

  downloadBlob(blob, `${filename}.png`);
}

/**
 * Exports mermaid content as SVG with watermark
 */
export async function exportMermaidAsSVG(
  content: string,
  filename: string,
  options: ExportSvgOptions = {},
  theme: DiagramTheme = 'cyber'
): Promise<void> {
  const { watermarkText = 'MermaidMuse', watermarkColor = '#2d2d2d', padding = 20 } = options;

  let svg = await renderMermaidToSvg(content, theme);

  svg = ensureSvgNamespaces(svg);
  svg = addSvgPadding(svg, padding);
  svg = addSvgWatermark(svg, watermarkText, watermarkColor);

  downloadBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), `${filename}.svg`);
}

/**
 * Exports the currently displayed SVG element as SVG
 */
export function exportDisplayedSvgAsSVG(
  svgElement: SVGSVGElement | null,
  filename: string,
  options: ExportSvgOptions = {}
): void {
  if (!svgElement) {
    throw new Error('No SVG element provided');
  }

  const { watermarkText = 'MermaidMuse', watermarkColor = '#2d2d2d', padding = 20 } = options;

  const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
  let svgString = new XMLSerializer().serializeToString(svgClone);

  svgString = ensureSvgNamespaces(svgString);
  svgString = addSvgPadding(svgString, padding);
  svgString = addSvgWatermark(svgString, watermarkText, watermarkColor);

  downloadBlob(new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' }), `${filename}.svg`);
}

export function exportDiagramAsJSON(content: string, filename: string): void {
  const dataStr = JSON.stringify({ content }, null, 2);
  downloadBlob(new Blob([dataStr], { type: 'application/json' }), `${filename}.json`);
}

export function exportDiagramAsText(content: string, filename: string): void {
  downloadBlob(new Blob([content], { type: 'text/plain' }), `${filename}.mmd`);
}

// Legacy exports
export async function exportElementAsPNG(
  element: HTMLElement,
  filename: string,
  options: ExportPngOptions = {}
): Promise<void> {
  const svgElement = element.querySelector('svg') as SVGSVGElement | null;
  if (svgElement) {
    await exportDisplayedSvgAsPNG(svgElement, filename, options);
  } else {
    throw new Error('No SVG found in element');
  }
}

export async function exportElementAsPNGById(
  elementId: string,
  filename: string,
  options?: ExportPngOptions
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id ${elementId} not found`);
  }
  await exportElementAsPNG(element, filename, options);
}

export async function exportDiagramAsPNG(elementId: string, filename: string): Promise<void> {
  await exportElementAsPNGById(elementId, filename, {
    backgroundColor: '#ffffff',
    scale: 4,
  });
}
