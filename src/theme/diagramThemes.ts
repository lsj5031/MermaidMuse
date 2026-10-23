/**
 * Legacy export for backward compatibility
 * The theme system is now pluggable via themeRegistry
 */

export type DiagramTheme = string;

export { getThemeIds, hasTheme, registerTheme, getTheme } from './themeRegistry';
