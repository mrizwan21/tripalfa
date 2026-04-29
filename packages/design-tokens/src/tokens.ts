/**
 * Apple-inspired design tokens for TripAlfa OTA Platform
 * Based on DESIGN.md Apple Design System
 */

// ============================================
// COLOR PALETTE - Apple Design System
// ============================================

export const colors = {
  // Primary Colors
  appleBlue: '#0071e3',
  linkBlue: '#0066cc',
  brightBlue: '#2997ff',

  // Neutral Colors
  pureBlack: '#000000',
  lightGray: '#f5f5f7',
  nearBlack: '#1d1d1f',
  white: '#ffffff',

  // Text Colors
  textPrimaryLight: 'rgba(0, 0, 0, 0.8)',
  textTertiaryLight: 'rgba(0, 0, 0, 0.48)',
  textPrimaryDark: '#ffffff',

  // Dark Surface Colors
  darkSurface1: '#272729',
  darkSurface2: '#262628',
  darkSurface3: '#28282a',
  darkSurface4: '#2a2a2d',
  darkSurface5: '#242426',

  // Button States
  buttonActive: '#ededf2',
  buttonDefaultLight: '#fafafc',
  overlay: 'rgba(210, 210, 215, 0.64)',
  white32: 'rgba(255, 255, 255, 0.32)',

  // Semantic Colors
  primary: '#0071e3',
  secondary: '#f5f5f7',
  success: '#30d158',
  warning: '#ff9f0a',
  error: '#ff453a',
  info: '#0a84ff',
} as const;

// ============================================
// TYPOGRAPHY - SF Pro via Inter
// ============================================

export const typography = {
  fontFamily: {
    display: "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Helvetica, Arial, sans-serif",
    body: "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif",
    mono: "'SF Mono', 'Monaco', 'Inconsolata', 'Fira Mono', 'Droid Sans Mono', 'Courier New', monospace",
  },

  fontSize: {
    displayHero: '56px',
    sectionHeading: '40px',
    tileHeading: '28px',
    cardTitle: '21px',
    subHeading: '21px',
    navHeading: '34px',
    subNav: '24px',
    body: '17px',
    bodyEmphasis: '17px',
    buttonLarge: '18px',
    button: '17px',
    link: '14px',
    caption: '14px',
    captionBold: '14px',
    micro: '12px',
    microBold: '12px',
    nano: '10px',
  },

  fontWeight: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  lineHeight: {
    tight: '1.07',
    normal: '1.47',
    relaxed: '2.41',
  },

  letterSpacing: {
    tight: '-0.28px',
    normal: '-0.374px',
    loose: 'normal',
  },
} as const;

// ============================================
// SPACING & LAYOUT
// ============================================

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
  xxxl: '64px',
} as const;

export const borderRadius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  pill: '980px',
  full: '9999px',
} as const;

export const shadows = {
  card: 'rgba(0, 0, 0, 0.22) 3px 5px 30px 0px',
  dropdown: '0 4px 12px rgba(0, 0, 0, 0.15)',
  focus: `0 0 0 3px ${colors.appleBlue}40`,
} as const;

// ============================================
// BREAKPOINTS
// ============================================

export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  xxl: '1536px',
} as const;

// ============================================
// Z-INDEX
// ============================================

export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  modalBackdrop: 1200,
  modal: 1300,
  popover: 1400,
  tooltip: 1500,
  toast: 1600,
} as const;

// ============================================
// ANIMATION & TRANSITIONS
// ============================================

export const animation = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  easing: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  },
} as const;

// ============================================
// EXPORT ALL TOKENS
// ============================================

export const tokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  breakpoints,
  zIndex,
  animation,
} as const;

export type DesignTokens = typeof tokens;
export type ColorTokens = typeof colors;
export type TypographyTokens = typeof typography;
