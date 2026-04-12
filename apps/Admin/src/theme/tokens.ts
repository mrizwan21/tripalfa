/**
 * Design System - Apple-Inspired Token Reference
 * Reference: design-standards/apple/DESIGN.md
 */

export const COLORS = {
  apple: {
    blue: '#0071e3',
    linkBlue: '#0066cc',
    brightBlue: '#2997ff',
    pureBlack: '#000000',
    lightGray: '#f5f5f7',
    nearBlack: '#1d1d1f',
    darkSurface1: '#272729',
    darkSurface2: '#262628',
    darkSurface3: '#2a2a2d',
    darkSurface4: '#242426',
    buttonActive: '#ededf2',
    filterBg: '#fafafc',
    overlay: 'rgba(210, 210, 215, 0.64)',
  },

  primary: {
    50: 'rgb(240 245 255)',
    100: 'rgb(224 234 255)',
    200: 'rgb(178 210 255)',
    300: 'rgb(102 163 255)',
    400: 'rgb(41 151 255)',
    500: 'rgb(0 113 227)',
    600: 'rgb(0 102 204)',
    700: 'rgb(0 82 163)',
    800: 'rgb(0 61 122)',
    900: 'rgb(0 41 82)',
  },

  secondary: {
    50: 'rgb(245 245 247)',
    100: 'rgb(229 229 234)',
    200: 'rgb(209 209 214)',
    300: 'rgb(199 199 204)',
    400: 'rgb(142 142 147)',
    500: 'rgb(99 99 102)',
    600: 'rgb(72 72 74)',
    700: 'rgb(58 58 60)',
    800: 'rgb(44 44 46)',
    900: 'rgb(29 29 31)',
  },

  success: {
    50: 'rgb(240 255 240)',
    100: 'rgb(200 255 200)',
    200: 'rgb(100 230 100)',
    300: 'rgb(50 205 50)',
    400: 'rgb(34 197 94)',
    500: 'rgb(0 139 0)',
    600: 'rgb(0 110 0)',
    700: 'rgb(0 80 0)',
    800: 'rgb(0 55 0)',
    900: 'rgb(0 30 0)',
  },

  warning: {
    50: 'rgb(255 248 235)',
    100: 'rgb(255 238 204)',
    200: 'rgb(255 213 128)',
    300: 'rgb(255 179 51)',
    400: 'rgb(255 149 0)',
    500: 'rgb(204 119 0)',
    600: 'rgb(153 89 0)',
    700: 'rgb(102 60 0)',
    800: 'rgb(77 45 0)',
    900: 'rgb(51 30 0)',
  },

  error: {
    50: 'rgb(255 242 241)',
    100: 'rgb(255 219 217)',
    200: 'rgb(255 173 168)',
    300: 'rgb(255 127 118)',
    400: 'rgb(255 69 58)',
    500: 'rgb(255 59 48)',
    600: 'rgb(214 48 39)',
    700: 'rgb(173 38 30)',
    800: 'rgb(132 28 21)',
    900: 'rgb(91 19 15)',
  },

  neutral: {
    50: 'rgb(245 245 247)',
    100: 'rgb(229 229 234)',
    200: 'rgb(209 209 214)',
    300: 'rgb(199 199 204)',
    400: 'rgb(142 142 147)',
    500: 'rgb(99 99 102)',
    600: 'rgb(72 72 74)',
    700: 'rgb(58 58 60)',
    800: 'rgb(44 44 46)',
    900: 'rgb(29 29 31)',
    950: 'rgb(0 0 0)',
  },

  background: {
    light: '#ffffff',
    dark: '#000000',
    sectionAlt: '#f5f5f7',
  },
  text: {
    primary: '#1d1d1f',
    secondary: 'rgba(0, 0, 0, 0.8)',
    tertiary: 'rgba(0, 0, 0, 0.48)',
    light: '#ffffff',
    lightSecondary: 'rgba(255, 255, 255, 0.8)',
    lightTertiary: 'rgba(255, 255, 255, 0.48)',
  },
  border: {
    light: '#d2d2d7',
    dark: 'rgba(255, 255, 255, 0.1)',
  },
} as const;

export const TYPOGRAPHY = {
  fontFamily: {
    display:
      '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Helvetica, Arial, sans-serif',
    body: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif',
  },

  fontSize: {
    displayHero: { size: '56px', lineHeight: '1.07', letterSpacing: '-0.28px', weight: '600' },
    sectionHeading: { size: '40px', lineHeight: '1.10', letterSpacing: 'normal', weight: '600' },
    tileHeading: { size: '28px', lineHeight: '1.14', letterSpacing: '0.196px', weight: '400' },
    cardTitle: { size: '21px', lineHeight: '1.19', letterSpacing: '0.231px', weight: '700' },
    subHeading: { size: '21px', lineHeight: '1.19', letterSpacing: '0.231px', weight: '400' },
    body: { size: '17px', lineHeight: '1.47', letterSpacing: '-0.374px', weight: '400' },
    bodyEmphasis: { size: '17px', lineHeight: '1.24', letterSpacing: '-0.374px', weight: '600' },
    linkCaption: { size: '14px', lineHeight: '1.43', letterSpacing: '-0.224px', weight: '400' },
    captionBold: { size: '14px', lineHeight: '1.29', letterSpacing: '-0.224px', weight: '600' },
    micro: { size: '12px', lineHeight: '1.33', letterSpacing: '-0.12px', weight: '400' },
    microBold: { size: '12px', lineHeight: '1.33', letterSpacing: '-0.12px', weight: '600' },
    nano: { size: '10px', lineHeight: '1.47', letterSpacing: '-0.08px', weight: '400' },
  },

  fontWeight: {
    light: 300,
    normal: 400,
    semibold: 600,
    bold: 700,
  },
} as const;

export const SPACING = {
  0: '0px',
  1: '2px',
  2: '4px',
  3: '5px',
  4: '6px',
  5: '7px',
  6: '8px',
  7: '10px',
  8: '11px',
  9: '14px',
  10: '15px',
  11: '17px',
  12: '20px',
  13: '24px',
  14: '32px',
  15: '40px',
  16: '48px',
  17: '64px',
  18: '96px',
} as const;

export const BORDER_RADIUS = {
  micro: '5px',
  standard: '8px',
  comfortable: '11px',
  large: '12px',
  pill: '980px',
  circle: '50%',
} as const;

export const SHADOWS = {
  none: 'none',
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.04)',
  sm: '0 1px 3px rgb(0 0 0 / 0.06)',
  md: '0 2px 4px rgb(0 0 0 / 0.08)',
  lg: 'rgba(0, 0, 0, 0.22) 3px 5px 30px 0px',
  xl: 'rgba(0, 0, 0, 0.22) 5px 8px 40px 0px',
  focus: '0 0 0 2px #0071e3',
  nav: '0 1px 0 rgba(0, 0, 0, 0.1)',
} as const;

export const GRADIENTS = {
  apple: 'linear-gradient(135deg, #0071e3 0%, #2997ff 100%)',
} as const;

export const TRANSITIONS = {
  duration: {
    0: '0ms',
    75: '75ms',
    100: '100ms',
    150: '150ms',
    200: '200ms',
    250: '250ms',
    300: '300ms',
    500: '500ms',
    700: '700ms',
    1000: '1000ms',
  },
  easing: {
    apple: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  },
  transition: {
    fast: 'all 150ms cubic-bezier(0.25, 0.1, 0.25, 1)',
    normal: 'all 250ms cubic-bezier(0.25, 0.1, 0.25, 1)',
    slow: 'all 400ms cubic-bezier(0.25, 0.1, 0.25, 1)',
  },
} as const;

export const Z_INDEX = {
  hide: -1,
  auto: 'auto',
  base: 0,
  dropdown: 500,
  sticky: 600,
  fixed: 700,
  backdrop: 750,
  offcanvas: 800,
  modal: 800,
  popover: 900,
  tooltip: 1000,
} as const;

export const BREAKPOINTS = {
  xs: '320px',
  sm: '360px',
  smMd: '480px',
  md: '640px',
  lg: '834px',
  xl: '1024px',
  '2xl': '1070px',
  '3xl': '1440px',
} as const;

export const COMPONENT_SIZES = {
  button: {
    sm: { px: '0.5rem', py: '0.5rem', fontSize: '14px', height: '2.25rem', borderRadius: '8px' },
    md: { px: '0.9375rem', py: '0.5rem', fontSize: '17px', height: '2.75rem', borderRadius: '8px' },
    lg: {
      px: '1.375rem',
      py: '0.5rem',
      fontSize: '17px',
      height: '3.25rem',
      borderRadius: '980px',
    },
  },
  input: {
    sm: { px: '0.75rem', py: '0.375rem', fontSize: '14px', height: '2.25rem', borderRadius: '8px' },
    md: { px: '1rem', py: '0.625rem', fontSize: '17px', height: '2.75rem', borderRadius: '8px' },
    lg: { px: '1.25rem', py: '0.75rem', fontSize: '17px', height: '3.25rem', borderRadius: '8px' },
  },
} as const;

export const ANIMATIONS = {
  fadeIn: `@keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }`,
  slideUp: `@keyframes slideUp { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }`,
  scaleIn: `@keyframes scaleIn { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }`,
  pulse: `@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`,
} as const;

export const SEMANTIC = {
  interactive: {
    default: COLORS.apple.blue,
    hover: '#0077ed',
    active: '#0066cc',
    disabled: COLORS.neutral[400],
    focus: COLORS.apple.blue,
  },
  status: {
    success: COLORS.success[500],
    warning: COLORS.warning[400],
    error: COLORS.error[500],
    info: COLORS.apple.blue,
  },
  background: {
    default: '#ffffff',
    section: '#f5f5f7',
    dark: '#000000',
    darkSurface: COLORS.apple.darkSurface1,
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  text: {
    primary: COLORS.text.primary,
    secondary: COLORS.text.secondary,
    tertiary: COLORS.text.tertiary,
    inverse: COLORS.text.light,
    link: COLORS.apple.linkBlue,
    linkDark: COLORS.apple.brightBlue,
  },
  border: {
    default: COLORS.border.light,
    dark: COLORS.border.dark,
    focus: COLORS.apple.blue,
  },
} as const;

export function getColor(path: string, opacity?: number): string {
  const parts = path.split('.');
  let value: any = COLORS;

  for (const part of parts) {
    value = value[part];
    if (!value) return '';
  }

  if (opacity !== undefined && opacity < 1) {
    const hex = value.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  return value;
}

export function getColorClasses(
  colorName: keyof typeof COLORS,
  property: 'bg' | 'text' | 'border' = 'text'
): string {
  return `${property}-${colorName}-500`;
}

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
