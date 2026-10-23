/**
 * Pluggable theme system for MermaidMuse
 * Users can define and register custom themes
 */

export type DiagramTheme = string;

export interface DiagramThemeConfig {
  label: string;
  colors: {
    background: string;
    foreground: string;
    line: string;
    surface: string;
    alternate: string;
  };
}

/**
 * Global theme registry
 */
const themeRegistry = new Map<string, DiagramThemeConfig>();

/**
 * Register a new theme
 */
export function registerTheme(id: DiagramTheme, config: DiagramThemeConfig): void {
  themeRegistry.set(id, config);
}

/**
 * Get a theme by ID
 */
export function getTheme(id: DiagramTheme): DiagramThemeConfig | undefined {
  return themeRegistry.get(id);
}

/**
 * Get all theme IDs
 */
export function getThemeIds(): string[] {
  return Array.from(themeRegistry.keys());
}

/**
 * Check if a theme exists
 */
export function hasTheme(id: DiagramTheme): boolean {
  return themeRegistry.has(id);
}
