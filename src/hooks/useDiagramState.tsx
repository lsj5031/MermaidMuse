import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { SAMPLE_MERMAID_DIAGRAM } from '@theme/constants';
import { ValidationResult, validateMermaidSyntax, debounce } from '@utils/validation';

export interface DiagramState {
  id: string;
  title: string;
  content: string;
  type: string;
  lastModified: Date;
  validation: ValidationResult;
  isValidating: boolean;
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
}

const DiagramContext = createContext<DiagramContextType | undefined>(undefined);

const DEFAULT_VALIDATION: ValidationResult = {
  isValid: true,
  errors: [],
  warnings: []
};

const DEFAULT_DIAGRAM: DiagramState = {
  id: '1',
  title: 'Untitled Diagram',
  content: SAMPLE_MERMAID_DIAGRAM,
  type: 'flowchart',
  lastModified: new Date(),
  validation: DEFAULT_VALIDATION,
  isValidating: false,
};

export function DiagramProvider({ children }: { children: ReactNode }) {
  const [currentDiagram, setCurrentDiagram] = useState<DiagramState>(DEFAULT_DIAGRAM);

  const updateDiagramContent = useCallback((content: string) => {
    setCurrentDiagram((prev) => ({
      ...prev,
      content,
      lastModified: new Date(),
      isValidating: true,
    }));
    
    // Trigger debounced validation for new content
    const validateContent = async () => {
      try {
        const result = await validateMermaidSyntax(content);
        setCurrentDiagram((prev) => ({
          ...prev,
          validation: result,
          isValidating: false,
        }));
      } catch (error) {
        console.error('Validation error:', error);
        setCurrentDiagram((prev) => ({
          ...prev,
          validation: {
            isValid: false,
            errors: [{
              line: 1,
              column: 1,
              message: 'Failed to validate diagram',
              severity: 'error',
              startLineNumber: 1,
              endLineNumber: 1,
              startColumn: 1,
              endColumn: 1
            }],
            warnings: []
          },
          isValidating: false,
        }));
      }
    };
    
    // Apply debounced validation
    const debouncedValidate = debounce(validateContent, 500);
    debouncedValidate();
  }, []);

  const validateDiagram = useCallback(async (content?: string) => {
    const contentToValidate = content !== undefined ? content : currentDiagram.content;
    
    setCurrentDiagram((prev) => ({
      ...prev,
      isValidating: true,
    }));

    try {
      const result = await validateMermaidSyntax(contentToValidate);
      setCurrentDiagram((prev) => ({
        ...prev,
        validation: result,
        isValidating: false,
      }));
    } catch (error) {
      console.error('Validation error:', error);
      setCurrentDiagram((prev) => ({
        ...prev,
        validation: {
          isValid: false,
          errors: [{
            line: 1,
            column: 1,
            message: 'Failed to validate diagram',
            severity: 'error',
            startLineNumber: 1,
            endLineNumber: 1,
            startColumn: 1,
            endColumn: 1
          }],
          warnings: []
        },
        isValidating: false,
      }));
    }
  }, []);

  const updateDiagramTitle = useCallback((title: string) => {
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
    setCurrentDiagram(DEFAULT_DIAGRAM);
    validateDiagram(DEFAULT_DIAGRAM.content);
  }, []);

  // Initial validation on mount
  useEffect(() => {
    validateDiagram();
  }, [validateDiagram]);

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
