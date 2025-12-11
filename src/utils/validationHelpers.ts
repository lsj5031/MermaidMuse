export function isValidMermaidSyntax(content: string): boolean {
  if (!content || content.trim().length === 0) {
    return false;
  }

  // Basic validation - check for common mermaid keywords
  const mermaidKeywords = [
    'graph',
    'flowchart',
    'sequenceDiagram',
    'classDiagram',
    'stateDiagram',
    'erDiagram',
    'gantt',
    'pie',
  ];

  return mermaidKeywords.some((keyword) => content.toLowerCase().includes(keyword));
}

export function sanitizeInput(input: string): string {
  return input.trim();
}

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
