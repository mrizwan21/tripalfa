/**
 * JSON export of design tokens for Apple-inspired design system
 */

import { tokens } from './tokens';

/**
 * JSON representation of all design tokens
 */
export const jsonTokens = {
  colors: tokens.colors,
  typography: tokens.typography,
  spacing: tokens.spacing,
  borderRadius: tokens.borderRadius,
  shadows: tokens.shadows,
  breakpoints: tokens.breakpoints,
  zIndex: tokens.zIndex,
  animation: tokens.animation,
} as const;

/**
 * Returns JSON string of all design tokens
 */
export function generateJSON(): string {
  return JSON.stringify(jsonTokens, null, 2);
}

/**
 * Type for JSON tokens
 */
export type JSONTokens = typeof jsonTokens;