/**
 * Design System - Token Reference
 * Central source of truth for all design tokens
 * Use these tokens to maintain consistency across all components
 */

// ============================================================================
// COLORS
// ============================================================================

export const COLORS = {
  // Primary Blue
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#3B82F6', // Main primary
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // Secondary Purple
  secondary: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#A855F7', // Main secondary
    600: '#9333ea',
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87',
  },

  // Success Green
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbef63',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#10b981', // Main success
    700: '#059669',
    800: '#047857',
    900: '#065f46',
  },

  // Warning Yellow
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24', // Main warning
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  // Error Red
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // Main error
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // Neutral Grayscale
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },

  // Semantic aliases
  background: {
    light: '#f8fafc',
    dark: '#0f172a',
  },
  text: {
    primary: '#0f172a',
    secondary: '#64748b',
    light: '#f8fafc',
  },
  border: {
    light: '#e2e8f0',
    dark: '#334155',
  },
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const TYPOGRAPHY = {
  // Font families
  fontFamily: {
    base: '"Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    display: '"Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  // Font sizes
  fontSize: {
    xs: { size: '0.75rem', lineHeight: '1rem' },
    sm: { size: '0.875rem', lineHeight: '1.25rem' },
    base: { size: '1rem', lineHeight: '1.5rem' },
    lg: { size: '1.125rem', lineHeight: '1.75rem' },
    xl: { size: '1.25rem', lineHeight: '1.75rem' },
    '2xl': { size: '1.5rem', lineHeight: '2rem' },
    '3xl': { size: '1.875rem', lineHeight: '2.25rem' },
    '4xl': { size: '2.25rem', lineHeight: '2.5rem' },
    '5xl': { size: '3rem', lineHeight: '1' },
  },

  // Font weights
  fontWeight: {
    thin: 100,
    extralight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },

  // Line heights
  lineHeight: {
    tight: 1.1,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },

  // Letter spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

// ============================================================================
// SPACING
// ============================================================================

export const SPACING = {
  0: '0px',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  32: '8rem',
  40: '10rem',
  48: '12rem',
  56: '14rem',
  64: '16rem',
  80: '20rem',
  96: '24rem',
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const BORDER_RADIUS = {
  none: '0px',
  sm: '0.25rem',
  base: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.5rem',
  '3xl': '2rem',
  full: '9999px',
} as const;

// ============================================================================
// SHADOWS
// ============================================================================

export const SHADOWS = {
  none: 'none',
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 2px 4px 0 rgb(0 0 0 / 0.08)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.15)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.15)',
  // Colored shadows
  'blue-glow': '0 0 20px rgb(59 130 246 / 0.3)',
  'purple-glow': '0 0 20px rgb(168 85 247 / 0.3)',
  'green-glow': '0 0 20px rgb(16 185 129 / 0.3)',
  'red-glow': '0 0 20px rgb(239 68 68 / 0.3)',
} as const;

// ============================================================================
// GRADIENTS
// ============================================================================

export const GRADIENTS = {
  primary: 'linear-gradient(to right, #3B82F6, #A855F7)',
  'primary-dark': 'linear-gradient(to right, #2563EB, #9333EA)',
  success: 'linear-gradient(to right, #10B981, #059669)',
  warning: 'linear-gradient(to right, #FBBF24, #F97316)',
  error: 'linear-gradient(to right, #EF4444, #DC2626)',
  dashboard: 'linear-gradient(135deg, #F0F9FF, #FDF2F8, #F8FAFC)',
  'dashboard-dark': 'linear-gradient(135deg, #0F172A, #1E1B4B, #0F172A)',
} as const;

// ============================================================================
// TRANSITIONS
// ============================================================================

export const TRANSITIONS = {
  // Duration
  duration: {
    0: '0ms',
    75: '75ms',
    100: '100ms',
    150: '150ms',
    200: '200ms',
    300: '300ms', // Standard
    500: '500ms',
    700: '700ms',
    1000: '1000ms',
  },

  // Easing
  easing: {
    linear: 'linear',
    'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
    'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
    'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Common transitions
  transition: {
    fast: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// ============================================================================
// Z-INDEX
// ============================================================================

export const Z_INDEX = {
  hide: -1,
  auto: 'auto',
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  'backdrop': 1040,
  'offcanvas': 1050,
  'modal': 1060,
  'popover': 1070,
  'tooltip': 1080,
} as const;

// ============================================================================
// BREAKPOINTS
// ============================================================================

export const BREAKPOINTS = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const BREAKPOINTS_PX = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// ============================================================================
// COMPONENT SIZES
// ============================================================================

export const COMPONENT_SIZES = {
  button: {
    sm: { px: '0.75rem', py: '0.375rem', fontSize: '0.875rem', height: '2rem' },
    md: { px: '1rem', py: '0.5rem', fontSize: '1rem', height: '2.5rem' },
    lg: { px: '1.5rem', py: '0.625rem', fontSize: '1.125rem', height: '3rem' },
  },
  input: {
    sm: { px: '0.5rem', py: '0.375rem', fontSize: '0.875rem', height: '2rem' },
    md: { px: '0.75rem', py: '0.5rem', fontSize: '1rem', height: '2.5rem' },
    lg: { px: '1rem', py: '0.625rem', fontSize: '1.125rem', height: '3rem' },
  },
  icon: {
    xs: '1rem',
    sm: '1.25rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '2.5rem',
    '2xl': '3rem',
  },
  avatar: {
    xs: '1.5rem',
    sm: '2rem',
    md: '2.5rem',
    lg: '3rem',
    xl: '3.5rem',
    '2xl': '4rem',
  },
} as const;

// ============================================================================
// ANIMATION KEYFRAMES
// ============================================================================

export const ANIMATIONS = {
  slideUp: `
    @keyframes slideUp {
      0% { height: 0; opacity: 0; }
      100% { height: 100%; opacity: 1; }
    }
  `,
  slideDown: `
    @keyframes slideDown {
      0% { height: 100%; opacity: 1; }
      100% { height: 0; opacity: 0; }
    }
  `,
  fadeIn: `
    @keyframes fadeIn {
      0% { opacity: 0; }
      100% { opacity: 1; }
    }
  `,
  fadeOut: `
    @keyframes fadeOut {
      0% { opacity: 1; }
      100% { opacity: 0; }
    }
  `,
  scaleIn: `
    @keyframes scaleIn {
      0% { opacity: 0; transform: scale(0.95); }
      100% { opacity: 1; transform: scale(1); }
    }
  `,
  pulse: `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `,
} as const;

// ============================================================================
// SEMANTIC TOKENS
// ============================================================================

export const SEMANTIC = {
  // Interactive states
  interactive: {
    default: COLORS.primary[600],
    hover: COLORS.primary[700],
    active: COLORS.primary[800],
    disabled: COLORS.neutral[400],
  },

  // Status indicators
  status: {
    success: COLORS.success[600],
    warning: COLORS.warning[400],
    error: COLORS.error[500],
    info: COLORS.primary[600],
  },

  // Backgrounds
  background: {
    default: COLORS.neutral[50],
    secondary: COLORS.neutral[100],
    tertiary: COLORS.neutral[200],
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  // Text colors
  text: {
    primary: COLORS.neutral[900],
    secondary: COLORS.neutral[600],
    tertiary: COLORS.neutral[500],
    inverse: COLORS.neutral[50],
    muted: COLORS.neutral[400],
  },

  // Borders
  border: {
    default: COLORS.neutral[200],
    light: COLORS.neutral[100],
    dark: COLORS.neutral[300],
    focus: COLORS.primary[600],
  },
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get a color by path and optional opacity
 * @example getColor('primary.600') // '#3B82F6'
 * @example getColor('success.500', 0.5) // 'rgba(34, 197, 94, 0.5)'
 */
export function getColor(
  path: string,
  opacity?: number
): string {
  const parts = path.split('.');
  let value: any = COLORS;

  for (const part of parts) {
    value = value[part];
    if (!value) return '';
  }

  if (opacity !== undefined && opacity < 1) {
    // Convert hex to rgba
    const hex = value.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  return value;
}

/**
 * Get combined Tailwind classes for a color
 * @example getColorClasses('primary', 'bg') // 'bg-primary-600'
 */
export function getColorClasses(
  colorName: keyof typeof COLORS,
  property: 'bg' | 'text' | 'border' = 'text'
): string {
  return `${property}-${colorName}-600`;
}

// ============================================================================
// EXPORT DEFAULT THEME
// ============================================================================

export const THEME = {
  colors: COLORS,
  typography: TYPOGRAPHY,
  spacing: SPACING,
  borderRadius: BORDER_RADIUS,
  shadows: SHADOWS,
  gradients: GRADIENTS,
  transitions: TRANSITIONS,
  zIndex: Z_INDEX,
  breakpoints: BREAKPOINTS,
  componentSizes: COMPONENT_SIZES,
  semantic: SEMANTIC,
} as const;

export default THEME;
