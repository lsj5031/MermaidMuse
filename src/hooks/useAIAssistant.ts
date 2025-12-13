import { useAuth } from '@clerk/clerk-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { analyzeDiagram, AnalyzeDiagramResponse, Suggestion } from '@utils/analyzeDiagramApi';

interface UseAIAssistantOptions {
  autoAnalyze?: boolean;
  debounceMs?: number;
  focusAreas?: string[];
}

interface UseAIAssistantReturn {
  suggestions: Suggestion[];
  complexity: AnalyzeDiagramResponse['complexity'] | null;
  diagramType: string | null;
  isAnalyzing: boolean;
  error: string | null;
  lastResponse: AnalyzeDiagramResponse | null;
  lastAnalyzedText: string | null;

  analyze: () => Promise<AnalyzeDiagramResponse | null>;
  dismiss: (suggestionId: string) => void;
  clear: () => void;
  hasChanges: boolean;
}

export function useAIAssistant(
  diagramText: string,
  options: UseAIAssistantOptions = {}
): UseAIAssistantReturn {
  const { getToken } = useAuth();
  const { autoAnalyze = false, debounceMs = 3000, focusAreas } = options;

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [complexity, setComplexity] = useState<AnalyzeDiagramResponse['complexity'] | null>(null);
  const [diagramType, setDiagramType] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAnalyzedText, setLastAnalyzedText] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<AnalyzeDiagramResponse | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAnalyzingRef = useRef(false);

  const analyze = useCallback(async (): Promise<AnalyzeDiagramResponse | null> => {
    if (isAnalyzingRef.current || !diagramText.trim()) return null;

    isAnalyzingRef.current = true;
    setIsAnalyzing(true);
    setError(null);

    try {
      const token = await getToken();
      const result = await analyzeDiagram(diagramText, { token, focusAreas });
      setLastResponse(result);

      if (result.ok) {
        setSuggestions(result.suggestions);
        setComplexity(result.complexity);
        setDiagramType(result.diagramType);
        setLastAnalyzedText(diagramText);
      } else {
        setError(result.error?.message ?? 'Analysis failed');
      }

      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      isAnalyzingRef.current = false;
      setIsAnalyzing(false);
    }
  }, [diagramText, focusAreas, getToken]);

  const dismiss = useCallback((suggestionId: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
  }, []);

  const clear = useCallback(() => {
    setSuggestions([]);
    setComplexity(null);
    setDiagramType(null);
    setLastAnalyzedText(null);
    setLastResponse(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (!autoAnalyze) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (diagramText !== lastAnalyzedText) {
        void analyze();
      }
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [autoAnalyze, analyze, debounceMs, diagramText, lastAnalyzedText]);

  return {
    suggestions,
    complexity,
    diagramType,
    isAnalyzing,
    error,
    lastResponse,
    lastAnalyzedText,
    analyze,
    dismiss,
    clear,
    hasChanges: diagramText !== lastAnalyzedText,
  };
}
