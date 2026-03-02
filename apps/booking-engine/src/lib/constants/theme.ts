/**
 * Theme Constants for TripAlfa Booking Engine
 *
 * Centralized color definitions for consistent theming across the application.
 * Updated to use navy as primary and red as accent.
 */

export const COLORS = {
  // Primary colors
  primary: "rgb(21 36 103)", // Navy - main brand color
  primaryHover: "rgb(10 28 80)", // Darker navy for hover states

  // Accent colors
  accent: "rgb(236 92 76)", // Red - for ratings, highlights
  accentLight: "rgb(255 215 0)", // Gold - legacy accent (use sparingly)

  // Legacy colors (for backward compatibility)
  purple: "rgb(139 92 246)",
  purpleLight: "rgb(167 139 250)",
  gold: "rgb(255 215 0)",

  // Semantic colors
  success: "rgb(16 185 129)",
  warning: "rgb(245 158 11)",
  error: "rgb(239 68 68)",
  info: "rgb(59 130 246)",

  // Neutral colors
  white: "rgb(255 255 255)",
  black: "rgb(0 0 0)",
  slate: {
    50: "rgb(248 250 252)",
    100: "rgb(241 245 249)",
    200: "rgb(226 232 240)",
    300: "rgb(203 213 225)",
    400: "rgb(148 163 184)",
    500: "rgb(100 116 139)",
    600: "rgb(71 85 105)",
    700: "rgb(51 65 85)",
    800: "rgb(30 41 59)",
    900: "rgb(15 23 42)",
  },
} as const;

// CSS class mappings for Tailwind
export const THEME_CLASSES = {
  primary: "bg-primary",
  primaryHover: "hover:bg-primary/90",
  accent: "bg-accent",
  textPrimary: "text-primary",
  textAccent: "text-accent",
  borderPrimary: "border-primary",
} as const;

// Demo mode configuration
export const DEMO_CONFIG = {
  // Enable demo mode with fallback data when API returns empty
  enabled: import.meta.env.VITE_DEMO_MODE === "true",

  // Default wallet balance for demo mode
  defaultWalletBalance: 2500,

  // Default currency for demo
  defaultCurrency: "USD",
} as const;

export type ColorKey = keyof typeof COLORS;
