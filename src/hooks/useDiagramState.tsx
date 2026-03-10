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

  theme: DiagramTheme;
  setTheme: (theme: DiagramTheme) => void;

  layoutEngine: LayoutEngine;
  setLayoutEngine: (engine: LayoutEngine) => void;

  handDrawn: boolean;
  setHandDrawn: (enabled: boolean) => void;

  registerEditorNavigationApi: (api: EditorNavigationApi | null) => void;
  revealInEditor: (lineNumber: number, column?: number) => void;
}

const DiagramContext = createContext<DiagramContextType | undefined>(undefined);

const DEFAULT_VALIDATION: ValidationResult = {
  isValid: true,
  errors: [],
  warnings: [],
};

export type LayoutEngine = 'dagre' | 'elk';

const STORAGE_KEYS = {
  content: 'diagramStudio.content',
  title: 'diagramStudio.title',
  theme: 'diagramStudio.theme',
  layoutEngine: 'diagramStudio.layoutEngine',
  handDrawn: 'diagramStudio.handDrawn',
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

const getInitialLayoutEngine = (): LayoutEngine => {
  const stored = localStorage.getItem(STORAGE_KEYS.layoutEngine);
  if (stored === 'elk' || stored === 'dagre') {
    return stored;
  }
  return 'elk';
};

const getInitialHandDrawn = (): boolean => {
  const stored = localStorage.getItem(STORAGE_KEYS.handDrawn);
  return stored === 'true';
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
  const [layoutEngine, setLayoutEngineState] = useState<LayoutEngine>(() => getInitialLayoutEngine());
  const [handDrawn, setHandDrawnState] = useState<boolean>(() => getInitialHandDrawn());

  const editorNavApiRef = useRef<EditorNavigationApi | null>(null);

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

  const debouncedSaveContent = useMemo(() => {
    return debounce((content: string) => {
      localStorage.setItem(STORAGE_KEYS.content, content);
    }, 1000);
  }, []);

  const updateDiagramContent = useCallback(
    (content: string) => {
      debouncedSaveContent(content);

      setCurrentDiagram((prev) => ({
        ...prev,
        content,
        lastModified: new Date(),
        isValidating: true,
      }));

      debouncedValidate(content);
    },
    [debouncedValidate, debouncedSaveContent]
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

  const setLayoutEngine = useCallback((engine: LayoutEngine) => {
    localStorage.setItem(STORAGE_KEYS.layoutEngine, engine);
    setLayoutEngineState(engine);
  }, []);

  const setHandDrawn = useCallback((enabled: boolean) => {
    localStorage.setItem(STORAGE_KEYS.handDrawn, String(enabled));
    setHandDrawnState(enabled);
  }, []);

  useEffect(() => {
    validateDiagram();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    theme,
    setTheme,

    layoutEngine,
    setLayoutEngine,

    handDrawn,
    setHandDrawn,

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
