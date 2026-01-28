import { render } from '@testing-library/react';
import { vi, describe, it, expect, afterEach } from 'vitest';
import Editor from './EditorModern';
import { useDiagramState } from '@hooks/useDiagramState';

// Mock the hook
vi.mock('@hooks/useDiagramState', () => ({
  useDiagramState: vi.fn(),
}));

describe('Editor Performance', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('measures render time with large content', () => {
    const LINE_COUNT = 5000;
    const ITERATIONS = 100;
    // Create content with 5000 lines
    const largeContent = Array(LINE_COUNT).fill('line content').join('\n');

    // Initial state
    const mockState = {
      currentDiagram: {
        content: largeContent,
        validation: { isValid: true, errors: [] },
        isValidating: false,
      },
      updateDiagramContent: vi.fn(),
    };

    (useDiagramState as any).mockReturnValue(mockState);

    const start = performance.now();

    const { rerender } = render(<Editor />);

    for (let i = 0; i < ITERATIONS; i++) {
        // Simulate a content change that doesn't change line count
        (useDiagramState as any).mockReturnValue({
            ...mockState,
            currentDiagram: {
                ...mockState.currentDiagram,
                // Simulate typing a char
                content: largeContent + (i % 2 === 0 ? ' ' : ''),
            }
        });

        rerender(<Editor />);
    }

    const end = performance.now();
    const duration = end - start;

    console.log(`[PERF] ${ITERATIONS} re-renders with ${LINE_COUNT} lines took: ${duration.toFixed(2)}ms`);

    expect(duration).toBeGreaterThan(0);
  });
});
