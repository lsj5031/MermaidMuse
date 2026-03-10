/**
 * Legacy export for backward compatibility
 * The theme system is now pluggable via themeRegistry
 */

export type DiagramTheme = string;

export { getMermaidConfigForTheme } from './themeRegistry';
export { getThemeIds, hasTheme, registerTheme, getTheme } from './themeRegistry';
