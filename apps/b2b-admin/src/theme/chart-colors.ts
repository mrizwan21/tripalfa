/**
 * Chart Colors — Centralized Palette
 *
 * Chart libraries (Recharts) use SVG fill/stroke attributes that cannot
 * reference CSS variables. These constants provide the single source of
 * truth for chart colors across the application.
 *
 * Colors are derived from the Optics design system tokens:
 * - Primary blue, secondary coral, accent cyan
 * - Extended with complementary colors for multi-series charts
 */

export const CHART_COLORS = {
  /** Primary blue — matches --op-color-alerts-info */
  blue: '#3b82f6',
  /** Emerald green — success/positive */
  green: '#10b981',
  /** Amber — warning/pending */
  amber: '#f59e0b',
  /** Red — destructive/error */
  red: '#ef4444',
  /** Violet — tertiary */
  violet: '#8b5cf6',
  /** Pink — quaternary */
  pink: '#ec4899',
  /** Teal — quinary */
  teal: '#14b8a6',
  /** Indigo — senary */
  indigo: '#6366f1',
  /** Orange */
  orange: '#f97316',
  /** Yellow */
  yellow: '#eab308',
  /** Lime */
  lime: '#22c55e',
} as const;

/** Ordered array for sequential chart series */
export const CHART_PALETTE = [
  CHART_COLORS.blue,
  CHART_COLORS.green,
  CHART_COLORS.violet,
  CHART_COLORS.amber,
  CHART_COLORS.pink,
  CHART_COLORS.teal,
  CHART_COLORS.indigo,
  CHART_COLORS.orange,
] as const;

/** 5-color categorical palette */
export const CHART_PALETTE_5 = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'] as const;

/** Status-based palette (red → orange → yellow → green) */
export const CHART_STATUS_PALETTE = [
  CHART_COLORS.red,
  CHART_COLORS.orange,
  CHART_COLORS.amber,
  CHART_COLORS.green,
] as const;

type ChartColorKey = keyof typeof CHART_COLORS;
