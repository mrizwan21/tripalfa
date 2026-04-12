/**
 * Chart Colors — Centralized Palette
 *
 * Chart libraries (Recharts) use SVG fill/stroke attributes that cannot
 * reference CSS variables. These constants provide the single source of
 * truth for chart colors across the application.
 *
 * Colors are derived from the Apple design system tokens:
 * - Apple Blue (#0071e3) as primary
 * - Apple-inspired neutral and status palette
 */

export const CHART_COLORS = {
  blue: '#0071e3',
  brightBlue: '#2997ff',
  nearBlack: '#1d1d1f',
  gray80: 'rgba(0, 0, 0, 0.8)',
  gray48: 'rgba(0, 0, 0, 0.48)',
  violet: '#8b5cf6',
  pink: '#ec4899',
  teal: '#14b8a6',
  indigo: '#6366f1',
  orange: '#f97316',
  yellow: '#eab308',
  lime: '#22c55e',
} as const;

export const CHART_PALETTE_5 = [
  '#0071e3',
  '#2997ff',
  '#1d1d1f',
  'rgba(0,0,0,0.8)',
  'rgba(0,0,0,0.48)',
] as const;

export const CHART_PALETTE = CHART_PALETTE_5;

export const CHART_STATUS_PALETTE = [
  CHART_COLORS.red,
  CHART_COLORS.orange,
  CHART_COLORS.amber,
  CHART_COLORS.green,
] as const;

type ChartColorKey = keyof typeof CHART_COLORS;
