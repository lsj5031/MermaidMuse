import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { renderDiagram } from '@utils/diagramRenderer';
import { createExportSvg } from '@utils/exportHelpers';
import { validateMermaidSyntax } from '@utils/validation';
import { initializeDefaultThemes } from '@theme/defaultThemes';
import { SAMPLE_MERMAID_DIAGRAM } from '@theme/constants';
import { DiagramProvider, useDiagramState } from '@hooks/useDiagramState';
import Preview from '@components/layout/PreviewModern';

// jsdom has no canvas; exercise Pele's built-in metrics fallback. Browser checks use real fonts.
vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
initializeDefaultThemes();
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  localStorage.clear();
});

const samples = [
  SAMPLE_MERMAID_DIAGRAM,
  'sequenceDiagram\nAlice->>Bob: Hello',
  'classDiagram\nAnimal <|-- Duck',
  'stateDiagram-v2\n[*] --> Active',
  'erDiagram\nCUSTOMER ||--o{ ORDER : places',
  'gantt\ndateFormat YYYY-MM-DD\nTask :a, 2026-01-01, 2d',
  'pie\n"A" : 40\n"B" : 60',
  'mindmap\n  root((Pele))\n    SVG',
  'timeline\n2026 : Pele',
  'gitGraph\ncommit',
  'journey\ntitle Trip\nsection Start\nWalk: 5: Me',
  'block-beta\ncolumns 1\na["A"]',
  'sankey-beta\nA,B,3',
  'C4Context\nPerson(user, "User")',
  'kanban\n  todo[Todo]\n    task[Task]',
];

describe('Pele integration', () => {
  it.each(samples)('renders supported source: %s', (source) => {
    const result = renderDiagram(source);
    const svg = new DOMParser().parseFromString(result.svg, 'image/svg+xml');
    expect(svg.querySelector('parsererror')).toBeNull();
    expect(svg.documentElement.classList.contains('pele')).toBe(true);
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
  });
  it('preserves directives, frontmatter and accessible titles', () => {
    const source =
      '---\ntitle: Saved diagram\nconfig:\n  layout: elk\n---\n%%{init: {"theme":"dark"}}%%\nflowchart LR\naccTitle: Accessible diagram\nA[Saved] --> B[Source]';
    expect(renderDiagram(source).svg).toContain('Accessible diagram');
  });
  it('embeds the selected palette and reserves an export watermark footer', () => {
    const preview = renderDiagram('graph TD\nA-->B', 'dracula');
    const exported = createExportSvg(
      'graph TD\nA-->B',
      { watermarkText: '<safe & text>' },
      'dracula'
    );
    expect(exported.svg).toContain('--pele-bg:#282A36');
    expect(exported.svg).toContain('Arial, sans-serif');
    expect(exported.height).toBe(preview.height + 28);
    expect(exported.svg).toContain('&lt;safe &amp; text&gt;');
  });
  it('widens narrow exports for the footer and preserves unwatermarked geometry', () => {
    const source = 'graph TD\nA';
    const preview = renderDiagram(source);
    const exported = createExportSvg(source);
    const svg = new DOMParser().parseFromString(exported.svg, 'image/svg+xml').documentElement;
    expect(exported.width).toBeGreaterThan(preview.width);
    expect(Number(svg.getAttribute('width'))).toBe(exported.width);
    expect(svg.getAttribute('viewBox')).toBe(`0 0 ${exported.width} ${exported.height}`);
    expect(Number(svg.lastElementChild?.getAttribute('x'))).toBe(exported.width - 8);
    const plain = createExportSvg(source, { watermarkText: '' });
    expect(plain.width).toBe(preview.width);
    expect(plain.height).toBe(preview.height);
  });
  it('does not inject scripts, event handlers or external links from source', () => {
    const svg = renderDiagram(
      'flowchart TD\nA["<img src=x onerror=alert(1)> & text"]\nclick A "javascript:alert(1)"'
    ).svg;
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    expect(doc.querySelector('script, foreignObject, image, a, [onerror], [onclick]')).toBeNull();
  });
  it('reports real syntax positions and source limits', async () => {
    const invalid = await validateMermaidSyntax('graph TD\nA -->');
    expect(invalid.isValid).toBe(false);
    expect(invalid.errors[0].line).toBeGreaterThanOrEqual(1);
    expect((await validateMermaidSyntax('graph TD\n' + 'x'.repeat(50001))).isValid).toBe(false);
  });
});

function Controls() {
  const state = useDiagramState();
  return (
    <>
      <textarea
        aria-label="Source"
        value={state.currentDiagram.content}
        onChange={(e) => state.updateDiagramContent(e.target.value)}
      />
      <button onClick={() => state.setTheme('dracula')}>Dark</button>
      <output>{String(state.canExport)}</output>
      <Preview />
    </>
  );
}

it.each(['graph TD\nA -->', 'sankey-beta\nA,B,3\nB,A,2'])(
  'restores source, rejects invalid rendering and recovers: %s',
  async (invalidSource) => {
    vi.useFakeTimers();
    localStorage.setItem('mermaidMuse.content', 'graph TD\nA[Persisted]');
    localStorage.setItem('mermaidMuse.title', 'Saved title');
    localStorage.setItem('mermaidMuse.layoutEngine', 'elk');
    localStorage.setItem('mermaidMuse.handDrawn', 'true');
    render(
      <DiagramProvider>
        <Controls />
      </DiagramProvider>
    );
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(document.querySelector('.pele-output')?.textContent).toContain('Persisted');
    fireEvent.change(screen.getByLabelText('Source'), {
      target: { value: 'graph TD\nA[Obsolete]' },
    });
    fireEvent.change(screen.getByLabelText('Source'), { target: { value: invalidSource } });
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByText('Unable to render diagram')).toBeInTheDocument();
    expect(document.querySelector('.pele-output')).toBeNull();
    expect(screen.getByRole('status').textContent).toBe('false');
    fireEvent.change(screen.getByLabelText('Source'), {
      target: { value: 'graph TD\nB[Recovered]' },
    });
    fireEvent.click(screen.getByText('Dark'));
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(document.querySelector('.pele-output')?.textContent).toContain('Recovered');
    expect(document.querySelector('.pele-output svg')?.getAttribute('style')).toContain(
      '--pele-bg:#282A36'
    );
    expect(localStorage.getItem('mermaidMuse.content')).toBe('graph TD\nB[Recovered]');
    expect(localStorage.getItem('mermaidMuse.title')).toBe('Saved title');
    expect(screen.getByRole('status').textContent).toBe('true');
    fireEvent.change(screen.getByLabelText('Source'), { target: { value: '' } });
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByText('Empty')).toBeInTheDocument();
    expect(screen.getByRole('status').textContent).toBe('false');
  }
);
