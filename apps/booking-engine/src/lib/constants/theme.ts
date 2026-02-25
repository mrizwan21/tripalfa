/**
 * Theme Constants for TripAlfa Booking Engine
 * 
 * Centralized color definitions for consistent theming across the application.
 * Updated to use navy (#152467) as primary and red (#EC5C4C) as accent.
 */

export const COLORS = {
  // Primary colors
  primary: '#152467',      // Navy - main brand color
  primaryHover: '#0A1C50', // Darker navy for hover states
  
  // Accent colors
  accent: '#EC5C4C',       // Red - for ratings, highlights
  accentLight: '#FFD700',   // Gold - legacy accent (use sparingly)
  
  // Legacy colors (for backward compatibility)
  purple: '#8B5CF6',
  purpleLight: '#A78BFA',
  gold: '#FFD700',
  
  // Semantic colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  slate: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
} as const;

// CSS class mappings for Tailwind
export const THEME_CLASSES = {
  primary: 'bg-[#152467]',
  primaryHover: 'hover:bg-[#0A1C50]',
  accent: 'bg-[#EC5C4C]',
  textPrimary: 'text-[#152467]',
  textAccent: 'text-[#EC5C4C]',
  borderPrimary: 'border-[#152467]',
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
