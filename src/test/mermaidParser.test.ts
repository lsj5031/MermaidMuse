import { describe, it, expect, vi } from 'vitest';
import { parseMermaidDiagram } from '../utils/mermaidParser';

// Mock mermaid.parse
vi.mock('mermaid', () => ({
  default: {
    parse: vi.fn().mockResolvedValue(true),
  },
}));

describe('mermaidParser', () => {
  it('should parse nodes and edges correctly', async () => {
    // Using separate lines for nodes and edges to ensure the simple regex parser works
    const content = `graph TD
      A[Start]
      B{Decision}
      C[End]
      A --> B
      B -->|Yes| C
      B -->|No| A
    `;

    const result = await parseMermaidDiagram(content);

    expect(result.nodes).toHaveLength(3);
    expect(result.edges).toHaveLength(3);

    const nodeIds = result.nodes.map(n => n.id);
    expect(nodeIds).toContain('A');
    expect(nodeIds).toContain('B');
    expect(nodeIds).toContain('C');
  });

  it('should ignore duplicate nodes', async () => {
    // A is defined twice
    const content = `graph TD
      A[Start]
      A[Start Again]
      B[End]
    `;

    const result = await parseMermaidDiagram(content);

    expect(result.nodes).toHaveLength(2);
    const nodeA = result.nodes.find(n => n.id === 'A');
    expect(nodeA).toBeDefined();
    // It should keep the first label
    expect(nodeA?.label).toBe('Start');
  });
});
