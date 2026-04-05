/**
 * Theme Constants for TripAlfa Booking Engine
 *
 * Centralized color definitions for consistent theming across the application.
 * Updated to use navy as primary and red as accent.
 */

export const COLORS = {
  // Primary colors
  primary: 'rgb(21 36 103)', // Navy - main brand color
  primaryHover: 'rgb(10 28 80)', // Darker navy for hover states

  // Accent colors
  accent: 'rgb(236 92 76)', // Red - for ratings, highlights
  accentLight: 'rgb(255 215 0)', // Gold - legacy accent (use sparingly)

  // Legacy colors (for backward compatibility)
  purple: 'rgb(139 92 246)',
  purpleLight: 'rgb(167 139 250)',
  gold: 'rgb(255 215 0)',

  // Semantic colors
  success: 'rgb(16 185 129)',
  warning: 'rgb(245 158 11)',
  error: 'rgb(239 68 68)',
  info: 'rgb(59 130 246)',

  // Neutral colors
  white: 'rgb(255 255 255)',
  black: 'rgb(0 0 0)',
  slate: {
    50: 'rgb(248 250 252)',
    100: 'rgb(241 245 249)',
    200: 'rgb(226 232 240)',
    300: 'rgb(203 213 225)',
    400: 'rgb(148 163 184)',
    500: 'rgb(100 116 139)',
    600: 'rgb(71 85 105)',
    700: 'rgb(51 65 85)',
    800: 'rgb(30 41 59)',
    900: 'rgb(15 23 42)',
  },
} as const;

// CSS class mappings for Tailwind
export const THEME_CLASSES = {
  primary: 'bg-primary',
  primaryHover: 'hover:bg-primary/90',
  accent: 'bg-accent',
  textPrimary: 'text-primary',
  textAccent: 'text-accent',
  borderPrimary: 'border-primary',
} as const;

// Demo mode configuration
export const DEMO_CONFIG = {
  // Enable demo mode with fallback data when API returns empty
  enabled: import.meta.env.VITE_DEMO_MODE === 'true',

  // Default wallet balance for demo mode
  defaultWalletBalance: 2500,

  // Default currency for demo
  defaultCurrency: 'USD',
} as const;

export type ColorKey = keyof typeof COLORS;

export const TYPOGRAPHY = {
  headings: {
    h72: 'text-[72px] leading-[1.1] tracking-[-0.03em] font-bold',
    h64: 'text-[64px] leading-[1.1] tracking-[-0.03em] font-bold',
    h56: 'text-[56px] leading-[1.1] tracking-[-0.03em] font-bold',
    h48: 'text-[48px] leading-[1.1] tracking-[-0.03em] font-bold',
    h40: 'text-[40px] leading-[1.1] tracking-[-0.03em] font-bold',
    h32: 'text-[32px] leading-[1.2] tracking-[-0.02em] font-bold',
    h24: 'text-[24px] leading-[1.2] tracking-[-0.02em] font-bold',
    h20: 'text-[20px] leading-[1.3] tracking-[-0.01em] font-bold',
    h16: 'text-[16px] leading-[1.3] tracking-[-0.01em] font-bold',
    h14: 'text-[14px] leading-[1.4] tracking-[-0.01em] font-bold',
  },
  body: {
    'body-lg': 'text-[18px] leading-[1.5] tracking-[0em] font-normal',
    'body-md': 'text-[16px] leading-[1.5] tracking-[0em] font-normal',
    'body-sm': 'text-[14px] leading-[1.5] tracking-[0em] font-normal',
    caption: 'text-[12px] leading-[1.5] tracking-[0.01em] font-normal',
  },
} as const;

export const SURFACES = {
  base: 'border bg-background rounded-md',
  raised: 'border bg-background rounded-md shadow-xs',
  elevated: 'border bg-background rounded-lg shadow-md',
  floating: 'border bg-background rounded-2xl shadow-xl',
} as const;

// Semantic color usage per WIG guidelines
export const SEMANTIC_COLORS = {
  // Neutrals for backgrounds and text
  text: {
    primary: 'text-foreground',
    secondary: 'text-muted-foreground',
    muted: 'text-neutral-500',
  },
  // Brand accent for highlights and CTAs
  brand: {
    default: 'bg-primary text-white',
    foreground: 'text-primary',
    border: 'border-primary',
    light: 'bg-primary-50 text-primary',
  },
  // Errors - always pair with text or icons
  error: {
    default: 'bg-error text-white',
    foreground: 'text-error',
    border: 'border-error',
    light: 'bg-error-50 text-error',
  },
  // Success for positive states
  success: {
    default: 'bg-success text-white',
    foreground: 'text-success',
    border: 'border-success',
    light: 'bg-success-50 text-success',
  },
  // Warning for caution states
  warning: {
    default: 'bg-warning text-black',
    foreground: 'text-warning',
    border: 'border-warning',
    light: 'bg-warning-50 text-warning',
  },
} as const;

// Focus states per WIG - clear, visible focus rings
export const FOCUS_STYLES = {
  default:
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  within:
    'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
} as const;

// Interaction states
export const INTERACTION_STATES = {
  hover: 'hover:opacity-90 transition-opacity duration-150',
  active: 'active:scale-[0.98] transition-transform duration-150',
  disabled: 'disabled:opacity-50 disabled:pointer-events-none',
} as const;

// Loading states per WIG - minimum duration to avoid flicker
export const LOADING_STATES = {
  button: 'opacity-80 cursor-wait',
  skeleton: 'animate-pulse bg-neutral-200',
} as const;

// Hit target minimums per WIG
export const HIT_TARGETS = {
  minimum: 'min-h-[24px] min-w-[24px]',
  mobile: 'min-h-[44px] min-w-[44px]',
} as const;
