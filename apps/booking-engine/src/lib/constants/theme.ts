/**
 * TripAlfa Design System - Kayak.com Inspired
 * 
 * Design Principles (based on Kayak's approach):
 * - Typography: Single font family, hierarchy through type weight/size only
 * - Color: Minimal palette, light/dark mode support, accessibility-first
 * - Empathy: Focus on human experience and simplicity
 * - Familiarity: Align with existing mental models
 * - Scalability: Multi-brand, multi-market support
 */

const COLORS = {
  // Primary - TripAlfa Navy (consistent brand)
  primary: '#003b95',
  primaryDark: '#002a6e',
  primaryLight: '#004bb5',

  // Accent - Vibrant Orange/Red for CTAs (Kayak-style)
  accent: '#ff5722',
  accentLight: '#ff8a65',
  accentDark: '#e64a19',

  // Semantic Colors - Minimal usage
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Neutrals - Clean grays for hierarchy
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },

  // Backgrounds
  background: {
    primary: '#ffffff',
    secondary: '#f8f9fa',
    tertiary: '#f1f3f4',
  },

  // Text hierarchy
  text: {
    primary: '#171717',
    secondary: '#525252',
    muted: '#a3a3a3',
    inverse: '#ffffff',
  },

  // Borders
  border: {
    light: '#e5e5e5',
    medium: '#d4d4d4',
    dark: '#a3a3a3',
  },
} as const;

// Typography - Single font family with responsive scaling
const TYPOGRAPHY = {
  // Font family - Inter for clean, modern readability
  fontFamily: {
    sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", monospace',
  },

  // Font weights for hierarchy
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Responsive type scale - mobile first
  fontSize: {
    // Display - Hero sections
    display: {
      sm: '2.5rem',    // 40px
      md: '3rem',      // 48px
      lg: '3.5rem',    // 56px
      xl: '4rem',      // 64px
    },
    
    // Headings
    h1: {
      sm: '1.75rem',   // 28px
      md: '2rem',      // 32px
      lg: '2.5rem',    // 40px
    },
    h2: {
      sm: '1.5rem',    // 24px
      md: '1.875rem',  // 30px
      lg: '2.25rem',   // 36px
    },
    h3: {
      sm: '1.25rem',   // 20px
      md: '1.5rem',    // 24px
      lg: '1.75rem',   // 28px
    },
    h4: {
      sm: '1.125rem',  // 18px
      md: '1.25rem',   // 20px
    },

    // Body text
    body: {
      lg: '1.125rem',  // 18px
      md: '1rem',      // 16px
      sm: '0.875rem',  // 14px
      xs: '0.75rem',   // 12px
    },

    // Labels and captions
    label: {
      lg: '0.875rem',  // 14px
      md: '0.75rem',   // 12px
      sm: '0.6875rem', // 11px
    },
  },

  // Line heights for readability
  lineHeight: {
    tight: 1.1,
    snug: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Letter spacing
  letterSpacing: {
    tighter: '-0.03em',
    tight: '-0.02em',
    normal: '0',
    wide: '0.01em',
    wider: '0.02em',
  },
} as const;

// Spacing - 8px base unit
const SPACING = {
  baseUnit: 4, // 4px base

  // Scale tokens
  scale: {
    0: '0px',
    0.5: '2px',
    1: '4px',
    1.5: '6px',
    2: '8px',
    2.5: '10px',
    3: '12px',
    3.5: '14px',
    4: '16px',
    5: '20px',
    6: '24px',
    7: '28px',
    8: '32px',
    9: '36px',
    10: '40px',
    11: '44px',
    12: '48px',
    14: '56px',
    16: '64px',
    20: '80px',
    24: '96px',
  },

  // Component-specific spacing
  component: {
    button: {
      paddingX: '16px',
      paddingY: '10px',
      paddingXLarge: '24px',
      paddingYLarge: '14px',
    },
    input: {
      paddingX: '12px',
      paddingY: '10px',
    },
    card: {
      padding: '16px',
      paddingLarge: '24px',
    },
    modal: {
      padding: '24px',
      paddingLarge: '32px',
    },
  },
} as const;

// Border radius - Consistent, rounded aesthetic
const RADIUS = {
  none: '0px',
  sm: '4px',
  DEFAULT: '8px',
  md: '10px',
  lg: '12px',
  xl: '16px',
  '2xl': '20px',
  '3xl': '24px',
  full: '9999px',
} as const;

// Shadows - Subtle, layered depth
const SHADOWS = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
} as const;

// Z-index scale
const Z_INDEX = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  modal: 1200,
  popover: 1300,
  tooltip: 1400,
} as const;

// Breakpoints - Mobile first
const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Animation tokens
const ANIMATION = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// Focus states - Clear, visible focus rings for accessibility
const FOCUS_RINGS = {
  default: '0 0 0 2px #ffffff, 0 0 0 4px #003b95',
  inset: 'inset 0 0 0 2px #003b95',
  outline: '0 0 0 3px rgba(0, 59, 149, 0.5)',
} as const;

// Surface variants
const SURFACES = {
  default: 'bg-white border border-gray-200 rounded-lg',
  elevated: 'bg-white border border-gray-200 rounded-lg shadow-md',
  floating: 'bg-white border border-gray-200 rounded-xl shadow-xl',
  flat: 'bg-gray-50 border-none rounded-lg',
} as const;

// Dark mode colors
const DARK_MODE = {
  colors: {
    background: {
      primary: '#171717',
      secondary: '#262626',
      tertiary: '#404040',
    },
    text: {
      primary: '#fafafa',
      secondary: '#d4d4d4',
      muted: '#a3a3a3',
    },
    border: {
      light: '#404040',
      medium: '#525252',
    },
  },
} as const;

// Export all tokens
export const DESIGN_SYSTEM = {
  colors: COLORS,
  typography: TYPOGRAPHY,
  spacing: SPACING,
  radius: RADIUS,
  shadows: SHADOWS,
  zIndex: Z_INDEX,
  breakpoints: BREAKPOINTS,
  animation: ANIMATION,
  focusRings: FOCUS_RINGS,
  surfaces: SURFACES,
  darkMode: DARK_MODE,
} as const;

// Legacy export for backward compatibility
export const COLORS_THEME = COLORS;
export const TYPOGRAPHY_LEGACY = TYPOGRAPHY;
export const SPACING_LEGACY = SPACING;

// Demo mode configuration
export const DEMO_CONFIG = {
  enabled: import.meta.env.VITE_DEMO_MODE === 'true',
  defaultWalletBalance: 2500,
  defaultCurrency: 'USD',
} as const;

// Type exports
export type ColorKey = keyof typeof COLORS;
export type TypographyKey = keyof typeof TYPOGRAPHY;
export type SpacingKey = keyof typeof SPACING['scale'];
export type RadiusKey = keyof typeof RADIUS;
export type ShadowKey = keyof typeof SHADOWS;