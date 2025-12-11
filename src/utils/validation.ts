import mermaid from 'mermaid';

export interface ValidationError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  startLineNumber?: number;
  endLineNumber?: number;
  startColumn?: number;
  endColumn?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  mermaidError?: string;
}

const DEBOUNCE_DELAY = 500;

export const debounce = (
  func: (...args: string[]) => void | Promise<void>,
  delay: number
): ((...args: string[]) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: string[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const validateMermaidSyntax = async (content: string): Promise<ValidationResult> => {
  if (!content.trim()) {
    return {
      isValid: true,
      errors: [],
      warnings: []
    };
  }

  try {
    // Try to parse the content
    await mermaid.parse(content);
    
    return {
      isValid: true,
      errors: [],
      warnings: []
    };
  } catch (error) {
    const err = error as { str?: string; message?: string };
    console.error('Mermaid validation error:', error);
    
    // Parse mermaid error to extract line/column information
    const errors = parseMermaidError(err.str || err.message || 'Unknown syntax error');
    
    return {
      isValid: false,
      errors,
      warnings: [],
      mermaidError: err.str || err.message
    };
  }
};

const parseMermaidError = (errorMessage: string): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  // Try to extract line information from mermaid error message
  const lineMatch = errorMessage.match(/line\s+(\d+)/i);
  const columnMatch = errorMessage.match(/column\s+(\d+)/i);
  
  const line = lineMatch ? parseInt(lineMatch[1], 10) : 1;
  const column = columnMatch ? parseInt(columnMatch[1], 10) : 1;
  
  // Clean up the error message
  const cleanMessage = errorMessage
    .replace(/^line\s+\d+\s*,?\s*column\s+\d+\s*:?\s*/i, '')
    .replace(/^(\d+):(\d+)\s*/, '')
    .trim();
  
  errors.push({
    line,
    column,
    message: cleanMessage || 'Syntax error',
    severity: 'error',
    startLineNumber: line,
    endLineNumber: line,
    startColumn: Math.max(1, column - 10),
    endColumn: column + 10
  });
  
  return errors;
};

// Removed - now handled inline with proper debouncing in useDiagramState

export const isOfflineValidationFallback = (error: string): boolean => {
  return error.toLowerCase().includes('network') || 
         error.toLowerCase().includes('offline') ||
         error.toLowerCase().includes('fetch');
};

export const getValidationStatusColor = (result: ValidationResult): string => {
  if (result.errors.length > 0) return 'text-red-400';
  if (result.warnings.length > 0) return 'text-yellow-400';
  return 'text-green-400';
};

export const getValidationStatusIcon = (result: ValidationResult): string => {
  if (result.errors.length > 0) return '⛔';
  if (result.warnings.length > 0) return '⚠️';
  return '✅';
};