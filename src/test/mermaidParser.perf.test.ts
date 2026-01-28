import { describe, it, expect, vi } from 'vitest';
import { parseMermaidDiagram } from '../utils/mermaidParser';

// Mock mermaid.parse
vi.mock('mermaid', () => ({
  default: {
    parse: vi.fn().mockResolvedValue(true),
  },
}));

describe('mermaidParser Performance', () => {
  it('measures parsing time for a large diagram', async () => {
    const nodeCount = 5000;
    let content = 'graph TD\n';

    // Generate nodes
    for (let i = 0; i < nodeCount; i++) {
      content += `Node${i}[Label ${i}]\n`;
    }

    // Generate some edges
    for (let i = 0; i < nodeCount - 1; i++) {
        content += `Node${i} --> Node${i+1}\n`;
    }

    const start = performance.now();
    await parseMermaidDiagram(content);
    const end = performance.now();

    console.log(`Parsing ${nodeCount} nodes took ${(end - start).toFixed(2)}ms`);

    // Simple assertion to ensure it ran
    expect(end - start).toBeGreaterThan(0);
  });
});
