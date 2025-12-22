import { useAuth } from '@clerk/clerk-react';
import { useCallback, useState, useEffect } from 'react';
import { refineDiagram, RefineDiagramResponse, RefinementTurn } from '@utils/refineDiagramApi';

interface UseAIRefinementReturn {
  turns: RefinementTurn[];
  isRefining: boolean;
  error: string | null;
  pendingResult: RefineDiagramResponse | null;

  refine: (instruction: string, currentDiagram: string) => Promise<RefineDiagramResponse | null>;
  applyPending: () => string | null;
  discardPending: () => void;
  undoToTurn: (turnId: string) => string | null;
  clearHistory: () => void;
}

export function useAIRefinement(diagramId: string = 'default'): UseAIRefinementReturn {
  const { getToken } = useAuth();

  const [turns, setTurns] = useState<RefinementTurn[]>([]);
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`mermaidmuse.refinement.${diagramId}`);
      if (stored) {
        setTurns(JSON.parse(stored));
      } else {
        setTurns([]);
      }
    } catch (e) {
      console.warn('Failed to load refinement history', e);
    }
  }, [diagramId]);

  // Save history to localStorage
  useEffect(() => {
    if (turns.length > 0) {
      localStorage.setItem(`mermaidmuse.refinement.${diagramId}`, JSON.stringify(turns));
    } else {
      localStorage.removeItem(`mermaidmuse.refinement.${diagramId}`);
    }
  }, [turns, diagramId]);
  const [pendingResult, setPendingResult] = useState<RefineDiagramResponse | null>(null);
  const [pendingDiagramBefore, setPendingDiagramBefore] = useState<string | null>(null);
  const [pendingInstruction, setPendingInstruction] = useState<string | null>(null);

  const refine = useCallback(
    async (instruction: string, currentDiagram: string) => {
      if (isRefining) return null;

      setIsRefining(true);
      setError(null);
      setPendingResult(null);
      setPendingDiagramBefore(currentDiagram);
      setPendingInstruction(instruction);

      try {
        const token = await getToken();
        const result = await refineDiagram(currentDiagram, instruction, {
          token,
          history: turns,
        });

        if (result.ok && result.refinedText) {
          setPendingResult(result);
        } else {
          setError(result.error?.message ?? 'Refinement failed');
          setPendingDiagramBefore(null);
          setPendingInstruction(null);
        }
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setPendingDiagramBefore(null);
        setPendingInstruction(null);
        return null;
      } finally {
        setIsRefining(false);
      }
    },
    [getToken, isRefining, turns]
  );

  const applyPending = useCallback((): string | null => {
    if (!pendingResult?.refinedText || !pendingDiagramBefore || !pendingInstruction) {
      return null;
    }

    const userTurn: RefinementTurn = {
      id: `turn_${Date.now()}_user`,
      role: 'user',
      instruction: pendingInstruction,
      diagramBefore: pendingDiagramBefore,
      diagramAfter: pendingResult.refinedText,
      timestamp: Date.now(),
    };

    const assistantTurn: RefinementTurn = {
      id: `turn_${Date.now()}_assistant`,
      role: 'assistant',
      instruction: pendingInstruction,
      diagramBefore: pendingDiagramBefore,
      diagramAfter: pendingResult.refinedText,
      summary: pendingResult.summary,
      timestamp: Date.now(),
    };

    setTurns((prev) => [...prev, userTurn, assistantTurn]);

    const refinedText = pendingResult.refinedText;
    setPendingResult(null);
    setPendingDiagramBefore(null);
    setPendingInstruction(null);

    return refinedText;
  }, [pendingResult, pendingDiagramBefore, pendingInstruction]);

  const discardPending = useCallback(() => {
    setPendingResult(null);
    setPendingDiagramBefore(null);
    setPendingInstruction(null);
  }, []);

  const undoToTurn = useCallback(
    (turnId: string): string | null => {
      const turnIndex = turns.findIndex((t) => t.id === turnId);
      if (turnIndex === -1) return null;

      const targetTurn = turns[turnIndex];
      setTurns((prev) => prev.slice(0, turnIndex));

      return targetTurn.diagramBefore;
    },
    [turns]
  );

  const clearHistory = useCallback(() => {
    setTurns([]);
    setPendingResult(null);
    setPendingDiagramBefore(null);
    setPendingInstruction(null);
    setError(null);
  }, []);

  return {
    turns,
    isRefining,
    error,
    pendingResult,
    refine,
    applyPending,
    discardPending,
    undoToTurn,
    clearHistory,
  };
}
