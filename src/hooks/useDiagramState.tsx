import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { SAMPLE_MERMAID_DIAGRAM } from '@theme/constants';
import { type DiagramTheme, getThemeIds, hasTheme } from '@theme/themeRegistry';
import { type ValidationResult, validateMermaidSyntax, debounce } from '@utils/validation';

export interface DiagramState {
  id: string;
  title: string;
  content: string;
  type: string;
  lastModified: Date;
  validation: ValidationResult;
  isValidating: boolean;
}

export interface EditorNavigationApi {
  revealPosition: (lineNumber: number, column?: number) => void;
}

interface DiagramContextType {
  currentDiagram: DiagramState;
  updateDiagramContent: (content: string) => void;
  updateDiagramTitle: (title: string) => void;
  updateDiagramType: (type: string) => void;
  resetDiagram: () => void;
  validateDiagram: (content?: string) => void;
  canExport: boolean;
  canRender: boolean;

  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  theme: DiagramTheme;
  setTheme: (theme: DiagramTheme) => void;

  registerEditorNavigationApi: (api: EditorNavigationApi | null) => void;
  revealInEditor: (lineNumber: number, column?: number) => void;
}

const DiagramContext = createContext<DiagramContextType | undefined>(undefined);

const DEFAULT_VALIDATION: ValidationResult = {
  isValid: true,
  errors: [],
  warnings: [],
};

const STORAGE_KEYS = {
  content: 'diagramStudio.content',
  title: 'diagramStudio.title',
  theme: 'diagramStudio.theme',
} as const;

const getSharedContentFromHash = (): string | null => {
  try {
    const hash = window.location.hash;
    if (!hash.startsWith('#')) return null;

    const params = new URLSearchParams(hash.slice(1));
    const raw = params.get('mmd');
    if (!raw) return null;

    return decodeURIComponent(raw);
  } catch {
    return null;
  }
};

const getInitialTheme = (): DiagramTheme => {
  const stored = localStorage.getItem(STORAGE_KEYS.theme);

  if (stored && hasTheme(stored)) {
    return stored;
  }

  // Prefer Avocado as the default when no user selection exists.
  if (hasTheme('avocado')) {
    return 'avocado';
  }

  const themeIds = getThemeIds();

  // Final fallback: first available theme, or avocado.
  return themeIds.length > 0 ? themeIds[0] : 'avocado';
};

const getInitialDiagram = (): DiagramState => {
  const shared = getSharedContentFromHash();

  const storedContent = localStorage.getItem(STORAGE_KEYS.content);
  const storedTitle = localStorage.getItem(STORAGE_KEYS.title);

  const content = shared ?? storedContent ?? SAMPLE_MERMAID_DIAGRAM;
  const title = shared ? 'Shared Diagram' : (storedTitle ?? 'Untitled Diagram');

  return {
    id: '1',
    title,
    content,
    type: 'flowchart',
    lastModified: new Date(),
    validation: DEFAULT_VALIDATION,
    isValidating: false,
  };
};

export function DiagramProvider({ children }: { children: ReactNode }) {
  const [currentDiagram, setCurrentDiagram] = useState<DiagramState>(() => getInitialDiagram());
  const [theme, setThemeState] = useState<DiagramTheme>(() => getInitialTheme());

  const [history, setHistory] = useState<{ past: string[]; future: string[] }>({
    past: [],
    future: [],
  });

  const editorNavApiRef = useRef<EditorNavigationApi | null>(null);
  const historyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHistoryContent = useRef<string>(currentDiagram.content);

  const registerEditorNavigationApi = useCallback((api: EditorNavigationApi | null) => {
    editorNavApiRef.current = api;
  }, []);

  const revealInEditor = useCallback((lineNumber: number, column: number = 1) => {
    editorNavApiRef.current?.revealPosition(lineNumber, column);
  }, []);

  const validateContent = useCallback(async (content: string) => {
    try {
      const result = await validateMermaidSyntax(content);
      console.log('[useDiagramState] Validation result:', result);
      setCurrentDiagram((prev) => ({
        ...prev,
        validation: result,
        isValidating: false,
      }));
    } catch (error) {
      console.error('[useDiagramState] Validation error:', error);
      setCurrentDiagram((prev) => ({
        ...prev,
        validation: {
          isValid: false,
          errors: [
            {
              line: 1,
              column: 1,
              message: 'Failed to validate diagram',
              severity: 'error',
              startLineNumber: 1,
              endLineNumber: 1,
              startColumn: 1,
              endColumn: 1,
            },
          ],
          warnings: [],
        },
        isValidating: false,
      }));
    }
  }, []);

  const debouncedValidate = useMemo(() => {
    return debounce((content: string) => {
      void validateContent(content);
    }, 500);
  }, [validateContent]);

  const addToHistory = useCallback((content: string) => {
    setHistory((prev) => {
      // Don't push if same as last saved
      if (prev.past.length > 0 && prev.past[prev.past.length - 1] === content) return prev;
      return {
        past: [...prev.past, lastHistoryContent.current],
        future: [],
      };
    });
    lastHistoryContent.current = content;
  }, []);

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;
      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, -1);

      setCurrentDiagram((curr) => ({
        ...curr,
        content: previous,
        lastModified: new Date(),
        isValidating: true,
      }));

      // Update local storage and validate immediately
      localStorage.setItem(STORAGE_KEYS.content, previous);
      debouncedValidate(previous);
      lastHistoryContent.current = previous;

      return {
        past: newPast,
        future: [currentDiagram.content, ...prev.future],
      };
    });
  }, [currentDiagram.content, debouncedValidate]);

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;
      const next = prev.future[0];
      const newFuture = prev.future.slice(1);

      setCurrentDiagram((curr) => ({
        ...curr,
        content: next,
        lastModified: new Date(),
        isValidating: true,
      }));

      localStorage.setItem(STORAGE_KEYS.content, next);
      debouncedValidate(next);
      lastHistoryContent.current = next;

      return {
        past: [...prev.past, currentDiagram.content],
        future: newFuture,
      };
    });
  }, [currentDiagram.content, debouncedValidate]);

  const updateDiagramContent = useCallback(
    (content: string) => {
      localStorage.setItem(STORAGE_KEYS.content, content);

      setCurrentDiagram((prev) => ({
        ...prev,
        content,
        lastModified: new Date(),
        isValidating: true,
      }));

      debouncedValidate(content);

      // Debounce history update
      if (historyTimeoutRef.current) {
        clearTimeout(historyTimeoutRef.current);
      }
      historyTimeoutRef.current = setTimeout(() => {
        addToHistory(content);
      }, 1000);
    },
    [debouncedValidate, addToHistory]
  );

  const validateDiagram = useCallback(
    (content?: string) => {
      const contentToValidate = content !== undefined ? content : currentDiagram.content;

      setCurrentDiagram((prev) => ({
        ...prev,
        isValidating: true,
      }));

      void validateContent(contentToValidate);
    },
    [currentDiagram.content, validateContent]
  );

  const updateDiagramTitle = useCallback((title: string) => {
    localStorage.setItem(STORAGE_KEYS.title, title);

    setCurrentDiagram((prev) => ({
      ...prev,
      title,
      lastModified: new Date(),
    }));
  }, []);

  const updateDiagramType = useCallback((type: string) => {
    setCurrentDiagram((prev) => ({
      ...prev,
      type,
      lastModified: new Date(),
    }));
  }, []);

  const resetDiagram = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.content);
    localStorage.removeItem(STORAGE_KEYS.title);

    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    const next = {
      ...getInitialDiagram(),
      title: 'Untitled Diagram',
      content: SAMPLE_MERMAID_DIAGRAM,
    };

    setCurrentDiagram(next);
    validateDiagram(next.content);
  }, [validateDiagram]);

  const setTheme = useCallback((nextTheme: DiagramTheme) => {
    localStorage.setItem(STORAGE_KEYS.theme, nextTheme);
    setThemeState(nextTheme);
  }, []);

  useEffect(() => {
    validateDiagram();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup debounced validation and history timeout on unmount
  useEffect(() => {
    return () => {
      debouncedValidate.cancel();
      if (historyTimeoutRef.current) {
        clearTimeout(historyTimeoutRef.current);
      }
    };
  }, [debouncedValidate]);

  const canExport = currentDiagram.validation.isValid && !currentDiagram.isValidating;
  const canRender = currentDiagram.validation.isValid && !currentDiagram.isValidating;

  const value: DiagramContextType = {
    currentDiagram,
    updateDiagramContent,
    updateDiagramTitle,
    updateDiagramType,
    resetDiagram,
    validateDiagram,
    canExport,
    canRender,

    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,

    theme,
    setTheme,

    registerEditorNavigationApi,
    revealInEditor,
  };

  return <DiagramContext.Provider value={value}>{children}</DiagramContext.Provider>;
}

export function useDiagramState(): DiagramContextType {
  const context = useContext(DiagramContext);
  if (context === undefined) {
    throw new Error('useDiagramState must be used within DiagramProvider');
  }
  return context;
}
