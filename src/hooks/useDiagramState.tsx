import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { SAMPLE_MERMAID_DIAGRAM } from '@theme/constants';

export interface DiagramState {
  id: string;
  title: string;
  content: string;
  type: string;
  lastModified: Date;
}

interface DiagramContextType {
  currentDiagram: DiagramState;
  updateDiagramContent: (content: string) => void;
  updateDiagramTitle: (title: string) => void;
  updateDiagramType: (type: string) => void;
  resetDiagram: () => void;
}

const DiagramContext = createContext<DiagramContextType | undefined>(undefined);

const DEFAULT_DIAGRAM: DiagramState = {
  id: '1',
  title: 'Untitled Diagram',
  content: SAMPLE_MERMAID_DIAGRAM,
  type: 'flowchart',
  lastModified: new Date(),
};

export function DiagramProvider({ children }: { children: ReactNode }) {
  const [currentDiagram, setCurrentDiagram] = useState<DiagramState>(DEFAULT_DIAGRAM);

  const updateDiagramContent = useCallback((content: string) => {
    setCurrentDiagram((prev) => ({
      ...prev,
      content,
      lastModified: new Date(),
    }));
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
  }, []);

  const value: DiagramContextType = {
    currentDiagram,
    updateDiagramContent,
    updateDiagramTitle,
    updateDiagramType,
    resetDiagram,
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
