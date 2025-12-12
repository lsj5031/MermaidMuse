import type { MermaidConfig } from 'mermaid';

/**
 * Pluggable theme system for MermaidMuse
 * Users can define and register custom themes
 */

export type DiagramTheme = string;

export interface DiagramThemeConfig {
  label: string;
  mermaid: MermaidConfig;
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
 * Get all registered themes
 */
export function getAllThemes(): Map<string, DiagramThemeConfig> {
  return new Map(themeRegistry);
}

/**
 * Get all theme IDs
 */
export function getThemeIds(): string[] {
  return Array.from(themeRegistry.keys());
}

/**
 * Get mermaid config for a theme
 */
export function getMermaidConfigForTheme(theme: DiagramTheme): MermaidConfig | null {
  const themeConfig = themeRegistry.get(theme);
  return themeConfig?.mermaid ?? null;
}

/**
 * Check if a theme exists
 */
export function hasTheme(id: DiagramTheme): boolean {
  return themeRegistry.has(id);
}

/**
 * Clear all themes (useful for testing)
 */
export function clearAllThemes(): void {
  themeRegistry.clear();
}

/**
 * Get node color for a theme (for backward compatibility)
 * Uses default color palette if not implementing per-theme colors
 */
export function getNodeColorForTheme(theme: DiagramTheme, nodeId: string): string {
  // Default palette for node coloring based on node ID hash
  const defaultPalette = ['#ff006e', '#00f5ff', '#b537f2', '#39ff14', '#fffd38', '#0080ff'];

  let hash = 0;
  for (let i = 0; i < nodeId.length; i++) {
    hash = nodeId.charCodeAt(i) + ((hash << 5) - hash);
  }

  return defaultPalette[Math.abs(hash) % defaultPalette.length];
}
