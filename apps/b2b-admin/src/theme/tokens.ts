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
    50: "rgb(240 249 255)",
    100: "rgb(224 242 254)",
    200: "rgb(186 230 253)",
    300: "rgb(125 211 252)",
    400: "rgb(56 189 248)",
    500: "rgb(14 165 233)",
    600: "rgb(59 130 246)", // Main primary
    700: "rgb(29 78 216)",
    800: "rgb(30 64 175)",
    900: "rgb(30 58 138)",
  },

  // Secondary Purple
  secondary: {
    50: "rgb(250 245 255)",
    100: "rgb(243 232 255)",
    200: "rgb(233 213 255)",
    300: "rgb(216 180 254)",
    400: "rgb(192 132 252)",
    500: "rgb(168 85 247)", // Main secondary
    600: "rgb(147 51 234)",
    700: "rgb(126 34 206)",
    800: "rgb(107 33 168)",
    900: "rgb(88 28 135)",
  },

  // Success Green
  success: {
    50: "rgb(240 253 244)",
    100: "rgb(220 252 231)",
    200: "rgb(187 239 99)",
    300: "rgb(134 239 172)",
    400: "rgb(74 222 128)",
    500: "rgb(34 197 94)",
    600: "rgb(16 185 129)", // Main success
    700: "rgb(5 150 105)",
    800: "rgb(4 120 87)",
    900: "rgb(6 95 70)",
  },

  // Warning Yellow
  warning: {
    50: "rgb(255 251 235)",
    100: "rgb(254 243 199)",
    200: "rgb(253 230 138)",
    300: "rgb(252 211 77)",
    400: "rgb(251 191 36)", // Main warning
    500: "rgb(245 158 11)",
    600: "rgb(217 119 6)",
    700: "rgb(180 83 9)",
    800: "rgb(146 64 14)",
    900: "rgb(120 53 15)",
  },

  // Error Red
  error: {
    50: "rgb(254 242 242)",
    100: "rgb(254 226 226)",
    200: "rgb(254 202 202)",
    300: "rgb(252 165 165)",
    400: "rgb(248 113 113)",
    500: "rgb(239 68 68)", // Main error
    600: "rgb(220 38 38)",
    700: "rgb(185 28 28)",
    800: "rgb(153 27 27)",
    900: "rgb(127 29 29)",
  },

  // Neutral Grayscale
  neutral: {
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

  // Semantic aliases
  background: {
    light: "rgb(248 250 252)",
    dark: "rgb(15 23 42)",
  },
  text: {
    primary: "rgb(15 23 42)",
    secondary: "rgb(100 116 139)",
    light: "rgb(248 250 252)",
  },
  border: {
    light: "rgb(226 232 240)",
    dark: "rgb(51 65 85)",
  },
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const TYPOGRAPHY = {
  // Font families
  fontFamily: {
    base: '"Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    display:
      '"Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  // Font sizes
  fontSize: {
    xs: { size: "0.75rem", lineHeight: "1rem" },
    sm: { size: "0.875rem", lineHeight: "1.25rem" },
    base: { size: "1rem", lineHeight: "1.5rem" },
    lg: { size: "1.125rem", lineHeight: "1.75rem" },
    xl: { size: "1.25rem", lineHeight: "1.75rem" },
    "2xl": { size: "1.5rem", lineHeight: "2rem" },
    "3xl": { size: "1.875rem", lineHeight: "2.25rem" },
    "4xl": { size: "2.25rem", lineHeight: "2.5rem" },
    "5xl": { size: "3rem", lineHeight: "1" },
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
    tighter: "-0.05em",
    tight: "-0.025em",
    normal: "0em",
    wide: "0.025em",
    wider: "0.05em",
    widest: "0.1em",
  },
} as const;

// ============================================================================
// SPACING
// ============================================================================

export const SPACING = {
  0: "0px",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
  32: "8rem",
  40: "10rem",
  48: "12rem",
  56: "14rem",
  64: "16rem",
  80: "20rem",
  96: "24rem",
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const BORDER_RADIUS = {
  none: "0px",
  sm: "0.25rem",
  base: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  "2xl": "1.5rem",
  "3xl": "2rem",
  full: "9999px",
} as const;

// ============================================================================
// SHADOWS
// ============================================================================

export const SHADOWS = {
  none: "none",
  xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  sm: "0 2px 4px 0 rgb(0 0 0 / 0.08)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.15)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.15)",
  // Colored shadows
  "blue-glow": "0 0 20px rgb(59 130 246 / 0.3)",
  "purple-glow": "0 0 20px rgb(168 85 247 / 0.3)",
  "green-glow": "0 0 20px rgb(16 185 129 / 0.3)",
  "red-glow": "0 0 20px rgb(239 68 68 / 0.3)",
} as const;

// ============================================================================
// GRADIENTS
// ============================================================================

export const GRADIENTS = {
  primary: "linear-gradient(to right, rgb(59 130 246), rgb(168 85 247))",
  "primary-dark": "linear-gradient(to right, rgb(37 99 235), rgb(147 51 234))",
  success: "linear-gradient(to right, rgb(16 185 129), rgb(5 150 105))",
  warning: "linear-gradient(to right, rgb(251 191 36), rgb(249 115 22))",
  error: "linear-gradient(to right, rgb(239 68 68), rgb(220 38 38))",
  dashboard:
    "linear-gradient(135deg, rgb(240 249 255), rgb(253 242 248), rgb(248 250 252))",
  "dashboard-dark":
    "linear-gradient(135deg, rgb(15 23 42), rgb(30 27 75), rgb(15 23 42))",
} as const;

// ============================================================================
// TRANSITIONS
// ============================================================================

export const TRANSITIONS = {
  // Duration
  duration: {
    0: "0ms",
    75: "75ms",
    100: "100ms",
    150: "150ms",
    200: "200ms",
    300: "300ms", // Standard
    500: "500ms",
    700: "700ms",
    1000: "1000ms",
  },

  // Easing
  easing: {
    linear: "linear",
    "ease-in": "cubic-bezier(0.4, 0, 1, 1)",
    "ease-out": "cubic-bezier(0, 0, 0.2, 1)",
    "ease-in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
  },

  // Common transitions
  transition: {
    fast: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
    normal: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
    slow: "all 500ms cubic-bezier(0.4, 0, 0.2, 1)",
  },
} as const;

// ============================================================================
// Z-INDEX
// ============================================================================

export const Z_INDEX = {
  hide: -1,
  auto: "auto",
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  backdrop: 1040,
  offcanvas: 1050,
  modal: 1060,
  popover: 1070,
  tooltip: 1080,
} as const;

// ============================================================================
// BREAKPOINTS
// ============================================================================

export const BREAKPOINTS = {
  xs: "320px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

export const BREAKPOINTS_PX = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

// ============================================================================
// COMPONENT SIZES
// ============================================================================

export const COMPONENT_SIZES = {
  button: {
    sm: { px: "0.75rem", py: "0.375rem", fontSize: "0.875rem", height: "2rem" },
    md: { px: "1rem", py: "0.5rem", fontSize: "1rem", height: "2.5rem" },
    lg: { px: "1.5rem", py: "0.625rem", fontSize: "1.125rem", height: "3rem" },
  },
  input: {
    sm: { px: "0.5rem", py: "0.375rem", fontSize: "0.875rem", height: "2rem" },
    md: { px: "0.75rem", py: "0.5rem", fontSize: "1rem", height: "2.5rem" },
    lg: { px: "1rem", py: "0.625rem", fontSize: "1.125rem", height: "3rem" },
  },
  icon: {
    xs: "1rem",
    sm: "1.25rem",
    md: "1.5rem",
    lg: "2rem",
    xl: "2.5rem",
    "2xl": "3rem",
  },
  avatar: {
    xs: "1.5rem",
    sm: "2rem",
    md: "2.5rem",
    lg: "3rem",
    xl: "3.5rem",
    "2xl": "4rem",
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
    overlay: "rgba(0, 0, 0, 0.5)",
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
 * @example getColor('primary.600') // 'rgb(59 130 246)'
 * @example getColor('success.500', 0.5) // 'rgba(34, 197, 94, 0.5)'
 */
export function getColor(path: string, opacity?: number): string {
  const parts = path.split(".");
  let value: any = COLORS;

  for (const part of parts) {
    value = value[part];
    if (!value) return "";
  }

  if (opacity !== undefined && opacity < 1) {
    // Convert hex to rgba
    const hex = value.replace("#", "");
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
  property: "bg" | "text" | "border" = "text",
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
