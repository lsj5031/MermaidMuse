import { describe, expect, it, vi } from 'vitest';
import { validateMermaidSyntax } from '@utils/validation';

// jsdom has no canvas; use Pele's font metrics fallback.
vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

describe('validateMermaidSyntax', () => {
  it('returns isValid=true for valid Mermaid', async () => {
    const result = await validateMermaidSyntax('graph TD\n  A[Start] --> B[End]');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns errors for invalid Mermaid and includes line/column info', async () => {
    const result = await validateMermaidSyntax('graph TD\n  A -->');
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].line).toBeGreaterThan(0);
    expect(result.errors[0].column).toBeGreaterThan(0);
    expect(result.mermaidError).toBeDefined();
  });
});
