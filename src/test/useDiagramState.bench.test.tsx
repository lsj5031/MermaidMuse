import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useDiagramState, DiagramProvider } from '../hooks/useDiagramState';
import { type ReactNode } from 'react';

const wrapper = ({ children }: { children: ReactNode }) => (
  <DiagramProvider>{children}</DiagramProvider>
);

describe('useDiagramState Performance Benchmark', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Spy on Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('debounces localStorage updates on content change', () => {
    const { result } = renderHook(() => useDiagramState(), { wrapper });

    const updates = 100;

    act(() => {
      for (let i = 0; i < updates; i++) {
        result.current.updateDiagramContent(`content ${i}`);
      }
    });

    // Should not have called setItem yet due to debounce
    // Note: getInitialDiagram calls getItem, but we are checking setItem.
    // Also updateDiagramTitle/Theme etc might call setItem if triggered, but here we only trigger updateDiagramContent.

    // We expect 0 calls since the last update.
    // Wait, getInitialDiagram calls localStorage.getItem, but usually doesn't call setItem unless it's setting defaults?
    // Looking at useDiagramState.tsx:
    // const [currentDiagram, setCurrentDiagram] = useState<DiagramState>(() => getInitialDiagram());
    // ...
    // useEffect(() => { validateDiagram(); }, []);

    // validateDiagram calls validateContent, which calls setCurrentDiagram.
    // It does NOT call setItem.

    // So setItem should be called 0 times initially.
    expect(localStorage.setItem).toHaveBeenCalledTimes(0);

    // Fast forward time to trigger debounce
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Should be called exactly once now with the last value
    expect(localStorage.setItem).toHaveBeenCalledTimes(1);
    expect(localStorage.setItem).toHaveBeenLastCalledWith(
      'diagramStudio.content',
      `content ${updates - 1}`
    );
  });
});
