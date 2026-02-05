/**
 * B2B Admin Module - Design System Utilities
 * UIUX Pro Principles Applied
 * Consistent Design System Implementation
 */

// Design token types
export interface DesignTokens {
  colors: {
    primary: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
    };
    secondary: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
    };
    semantic: {
      success: {
        50: string;
        100: string;
        200: string;
        300: string;
        400: string;
        500: string;
        600: string;
        700: string;
        800: string;
        900: string;
      };
      warning: {
        50: string;
        100: string;
        200: string;
        300: string;
        400: string;
        500: string;
        600: string;
        700: string;
        800: string;
        900: string;
      };
      danger: {
        50: string;
        100: string;
        200: string;
        300: string;
        400: string;
        500: string;
        600: string;
        700: string;
        800: string;
        900: string;
      };
    };
    neutral: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
    };
  };
  spacing: {
    0: string;
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
    6: string;
    8: string;
    10: string;
    12: string;
    16: string;
    20: string;
    24: string;
    32: string;
    40: string;
    48: string;
    56: string;
    64: string;
  };
  typography: {
    fontFamily: {
      primary: string;
      mono: string;
    };
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
      '4xl': string;
      '5xl': string;
      '6xl': string;
    };
    fontWeight: {
      thin: number;
      light: number;
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
      extrabold: number;
      black: number;
    };
    lineHeight: {
      tight: number;
      snug: number;
      normal: number;
      relaxed: number;
      loose: number;
    };
    letterSpacing: {
      tighter: string;
      tight: string;
      normal: string;
      wide: string;
      wider: string;
      widest: string;
    };
  };
  borderRadius: {
    none: string;
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    full: string;
  };
  shadows: {
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    inner: string;
    none: string;
  };
  transitions: {
    duration: {
      75: string;
      100: string;
      150: string;
      200: string;
      300: string;
      500: string;
      700: string;
      1000: string;
    };
    easing: {
      linear: string;
      in: string;
      out: string;
      inOut: string;
    };
  };
}

// Design tokens
export const designTokens: DesignTokens = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    secondary: {
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
    semantic: {
      success: {
        50: '#ecfdf5',
        100: '#d1fae5',
        200: '#a7f3d0',
        300: '#6ee7b7',
        400: '#34d399',
        500: '#10b981',
        600: '#059669',
        700: '#047857',
        800: '#065f46',
        900: '#064e3b',
      },
      warning: {
        50: '#fffbeb',
        100: '#fef3c7',
        200: '#fde68a',
        300: '#fcd34d',
        400: '#fbbf24',
        500: '#f59e0b',
        600: '#d97706',
        700: '#b45309',
        800: '#92400e',
        900: '#78350f',
      },
      danger: {
        50: '#fef2f2',
        100: '#fee2e2',
        200: '#fecaca',
        300: '#fca5a5',
        400: '#f87171',
        500: '#ef4444',
        600: '#dc2626',
        700: '#b91c1c',
        800: '#991b1b',
        900: '#7f1d1d',
      },
    },
    neutral: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
  },
  spacing: {
    0: '0',
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
  },
  typography: {
    fontFamily: {
      primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
      mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
    },
    fontWeight: {
      thin: 100,
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900,
    },
    lineHeight: {
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
  },
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    base: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    none: 'none',
  },
  transitions: {
    duration: {
      75: '75ms',
      100: '100ms',
      150: '150ms',
      200: '200ms',
      300: '300ms',
      500: '500ms',
      700: '700ms',
      1000: '1000ms',
    },
    easing: {
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
};

// Utility functions for design system
export const designSystem = {
  // Color utilities
  getColor: (colorPath: string): string => {
    const path = colorPath.split('.');
    let current: any = designTokens.colors;
    
    for (const segment of path) {
      if (typeof current === 'object' && current !== null && segment in current) {
        current = current[segment];
      } else {
        return '#000000'; // Fallback color
      }
    }
    
    return current as string;
  },

  // Spacing utilities
  getSpacing: (size: keyof DesignTokens['spacing']): string => {
    return designTokens.spacing[size];
  },

  // Typography utilities
  getFontSize: (size: keyof DesignTokens['typography']['fontSize']): string => {
    return designTokens.typography.fontSize[size];
  },

  getFontWeight: (weight: keyof DesignTokens['typography']['fontWeight']): number => {
    return designTokens.typography.fontWeight[weight];
  },

  getLineHeight: (height: keyof DesignTokens['typography']['lineHeight']): number => {
    return designTokens.typography.lineHeight[height];
  },

  getLetterSpacing: (spacing: keyof DesignTokens['typography']['letterSpacing']): string => {
    return designTokens.typography.letterSpacing[spacing];
  },

  // Border radius utilities
  getBorderRadius: (size: keyof DesignTokens['borderRadius']): string => {
    return designTokens.borderRadius[size];
  },

  // Shadow utilities
  getShadow: (size: keyof DesignTokens['shadows']): string => {
    return designTokens.shadows[size];
  },

  // Transition utilities
  getTransitionDuration: (duration: keyof DesignTokens['transitions']['duration']): string => {
    return designTokens.transitions.duration[duration];
  },

  getTransitionEasing: (easing: keyof DesignTokens['transitions']['easing']): string => {
    return designTokens.transitions.easing[easing];
  },

  // Component style generators
  getButtonStyles: (variant: 'primary' | 'secondary' | 'ghost' | 'danger' = 'primary') => {
    const baseStyles = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: designTokens.spacing[2],
      padding: `${designTokens.spacing[3]} ${designTokens.spacing[4]}`,
      fontSize: designTokens.typography.fontSize.sm,
      fontWeight: designTokens.typography.fontWeight.semibold,
      lineHeight: 1,
      letterSpacing: designTokens.typography.letterSpacing.wide,
      borderRadius: designTokens.borderRadius.lg,
      border: '1px solid transparent',
      cursor: 'pointer',
      transition: `all ${designTokens.transitions.duration[150]} ${designTokens.transitions.easing.inOut}`,
      textDecoration: 'none',
      userSelect: 'none',
      outline: 'none',
    };

    const variants = {
      primary: {
        backgroundColor: designTokens.colors.primary[600],
        color: '#ffffff',
        borderColor: designTokens.colors.primary[600],
        boxShadow: designTokens.shadows.md,
      },
      secondary: {
        backgroundColor: designTokens.colors.neutral[50],
        color: designTokens.colors.neutral[900],
        borderColor: designTokens.colors.neutral[200],
      },
      ghost: {
        backgroundColor: 'transparent',
        color: designTokens.colors.neutral[900],
        borderColor: 'transparent',
      },
      danger: {
        backgroundColor: designTokens.colors.semantic.danger[600],
        color: '#ffffff',
        borderColor: designTokens.colors.semantic.danger[600],
      },
    };

    return {
      ...baseStyles,
      ...variants[variant],
    };
  },

  getCardStyles: () => {
    return {
      backgroundColor: designTokens.colors.neutral[50],
      border: `1px solid ${designTokens.colors.neutral[200]}`,
      borderRadius: designTokens.borderRadius.lg,
      boxShadow: designTokens.shadows.base,
      overflow: 'hidden',
      transition: `all ${designTokens.transitions.duration[150]} ${designTokens.transitions.easing.inOut}`,
    };
  },

  getInputStyles: (state: 'default' | 'focus' | 'error' | 'success' = 'default') => {
    const baseStyles = {
      width: '100%',
      padding: `${designTokens.spacing[3]} ${designTokens.spacing[4]}`,
      fontSize: designTokens.typography.fontSize.base,
      fontWeight: designTokens.typography.fontWeight.normal,
      lineHeight: designTokens.typography.lineHeight.normal,
      color: designTokens.colors.neutral[900],
      backgroundColor: designTokens.colors.neutral[50],
      border: `1px solid ${designTokens.colors.neutral[200]}`,
      borderRadius: designTokens.borderRadius.lg,
      outline: 'none',
      transition: `all ${designTokens.transitions.duration[150]} ${designTokens.transitions.easing.inOut}`,
    };

    const states = {
      default: {
        borderColor: designTokens.colors.neutral[200],
      },
      focus: {
        borderColor: designTokens.colors.primary[500],
        boxShadow: `0 0 0 3px rgba(59, 130, 246, 0.1)`,
      },
      error: {
        borderColor: designTokens.colors.semantic.danger[300],
        boxShadow: `0 0 0 3px rgba(239, 68, 68, 0.1)`,
      },
      success: {
        borderColor: designTokens.colors.semantic.success[300],
        boxShadow: `0 0 0 3px rgba(16, 185, 129, 0.1)`,
      },
    };

    return {
      ...baseStyles,
      ...states[state],
    };
  },

  getBadgeStyles: (variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline' = 'primary') => {
    const baseStyles = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: designTokens.spacing[1],
      padding: `${designTokens.spacing[1]} ${designTokens.spacing[2]}`,
      fontSize: designTokens.typography.fontSize.xs,
      fontWeight: designTokens.typography.fontWeight.semibold,
      lineHeight: 1,
      letterSpacing: designTokens.typography.letterSpacing.wide,
      borderRadius: designTokens.borderRadius.full,
      border: '1px solid transparent',
      textTransform: 'uppercase' as const,
    };

    const variants = {
      primary: {
        backgroundColor: designTokens.colors.primary[100],
        color: designTokens.colors.primary[800],
        borderColor: designTokens.colors.primary[200],
      },
      secondary: {
        backgroundColor: designTokens.colors.secondary[100],
        color: designTokens.colors.secondary[800],
        borderColor: designTokens.colors.secondary[200],
      },
      success: {
        backgroundColor: designTokens.colors.semantic.success[100],
        color: designTokens.colors.semantic.success[800],
        borderColor: designTokens.colors.semantic.success[200],
      },
      warning: {
        backgroundColor: designTokens.colors.semantic.warning[100],
        color: designTokens.colors.semantic.warning[800],
        borderColor: designTokens.colors.semantic.warning[200],
      },
      danger: {
        backgroundColor: designTokens.colors.semantic.danger[100],
        color: designTokens.colors.semantic.danger[800],
        borderColor: designTokens.colors.semantic.danger[200],
      },
      outline: {
        backgroundColor: 'transparent',
        color: designTokens.colors.neutral[600],
        borderColor: designTokens.colors.neutral[300],
      },
    };

    return {
      ...baseStyles,
      ...variants[variant],
    };
  },
};

// Design system validation
export const validateDesignSystem = () => {
  const errors: string[] = [];
  
  // Check color consistency
  const primaryColors = Object.values(designTokens.colors.primary);
  const secondaryColors = Object.values(designTokens.colors.secondary);
  const neutralColors = Object.values(designTokens.colors.neutral);
  
  if (new Set(primaryColors).size !== primaryColors.length) {
    errors.push('Primary colors have duplicates');
  }
  
  if (new Set(secondaryColors).size !== secondaryColors.length) {
    errors.push('Secondary colors have duplicates');
  }
  
  if (new Set(neutralColors).size !== neutralColors.length) {
    errors.push('Neutral colors have duplicates');
  }
  
  // Check spacing consistency
  const spacingValues = Object.values(designTokens.spacing);
  if (new Set(spacingValues).size !== spacingValues.length) {
    errors.push('Spacing values have duplicates');
  }
  
  // Check typography consistency
  const fontSizes = Object.values(designTokens.typography.fontSize);
  if (new Set(fontSizes).size !== fontSizes.length) {
    errors.push('Font sizes have duplicates');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// CSS-in-JS utilities for styled-components or emotion
export const cssVars = {
  // Color variables
  '--color-primary-50': designTokens.colors.primary[50],
  '--color-primary-100': designTokens.colors.primary[100],
  '--color-primary-200': designTokens.colors.primary[200],
  '--color-primary-300': designTokens.colors.primary[300],
  '--color-primary-400': designTokens.colors.primary[400],
  '--color-primary-500': designTokens.colors.primary[500],
  '--color-primary-600': designTokens.colors.primary[600],
  '--color-primary-700': designTokens.colors.primary[700],
  '--color-primary-800': designTokens.colors.primary[800],
  '--color-primary-900': designTokens.colors.primary[900],
  
  '--color-secondary-50': designTokens.colors.secondary[50],
  '--color-secondary-100': designTokens.colors.secondary[100],
  '--color-secondary-200': designTokens.colors.secondary[200],
  '--color-secondary-300': designTokens.colors.secondary[300],
  '--color-secondary-400': designTokens.colors.secondary[400],
  '--color-secondary-500': designTokens.colors.secondary[500],
  '--color-secondary-600': designTokens.colors.secondary[600],
  '--color-secondary-700': designTokens.colors.secondary[700],
  '--color-secondary-800': designTokens.colors.secondary[800],
  '--color-secondary-900': designTokens.colors.secondary[900],
  
  '--color-success-50': designTokens.colors.semantic.success[50],
  '--color-success-100': designTokens.colors.semantic.success[100],
  '--color-success-200': designTokens.colors.semantic.success[200],
  '--color-success-300': designTokens.colors.semantic.success[300],
  '--color-success-400': designTokens.colors.semantic.success[400],
  '--color-success-500': designTokens.colors.semantic.success[500],
  '--color-success-600': designTokens.colors.semantic.success[600],
  '--color-success-700': designTokens.colors.semantic.success[700],
  '--color-success-800': designTokens.colors.semantic.success[800],
  '--color-success-900': designTokens.colors.semantic.success[900],
  
  '--color-warning-50': designTokens.colors.semantic.warning[50],
  '--color-warning-100': designTokens.colors.semantic.warning[100],
  '--color-warning-200': designTokens.colors.semantic.warning[200],
  '--color-warning-300': designTokens.colors.semantic.warning[300],
  '--color-warning-400': designTokens.colors.semantic.warning[400],
  '--color-warning-500': designTokens.colors.semantic.warning[500],
  '--color-warning-600': designTokens.colors.semantic.warning[600],
  '--color-warning-700': designTokens.colors.semantic.warning[700],
  '--color-warning-800': designTokens.colors.semantic.warning[800],
  '--color-warning-900': designTokens.colors.semantic.warning[900],
  
  '--color-danger-50': designTokens.colors.semantic.danger[50],
  '--color-danger-100': designTokens.colors.semantic.danger[100],
  '--color-danger-200': designTokens.colors.semantic.danger[200],
  '--color-danger-300': designTokens.colors.semantic.danger[300],
  '--color-danger-400': designTokens.colors.semantic.danger[400],
  '--color-danger-500': designTokens.colors.semantic.danger[500],
  '--color-danger-600': designTokens.colors.semantic.danger[600],
  '--color-danger-700': designTokens.colors.semantic.danger[700],
  '--color-danger-800': designTokens.colors.semantic.danger[800],
  '--color-danger-900': designTokens.colors.semantic.danger[900],
  
  '--color-neutral-50': designTokens.colors.neutral[50],
  '--color-neutral-100': designTokens.colors.neutral[100],
  '--color-neutral-200': designTokens.colors.neutral[200],
  '--color-neutral-300': designTokens.colors.neutral[300],
  '--color-neutral-400': designTokens.colors.neutral[400],
  '--color-neutral-500': designTokens.colors.neutral[500],
  '--color-neutral-600': designTokens.colors.neutral[600],
  '--color-neutral-700': designTokens.colors.neutral[700],
  '--color-neutral-800': designTokens.colors.neutral[800],
  '--color-neutral-900': designTokens.colors.neutral[900],
  
  // Spacing variables
  '--spacing-0': designTokens.spacing[0],
  '--spacing-1': designTokens.spacing[1],
  '--spacing-2': designTokens.spacing[2],
  '--spacing-3': designTokens.spacing[3],
  '--spacing-4': designTokens.spacing[4],
  '--spacing-5': designTokens.spacing[5],
  '--spacing-6': designTokens.spacing[6],
  '--spacing-8': designTokens.spacing[8],
  '--spacing-10': designTokens.spacing[10],
  '--spacing-12': designTokens.spacing[12],
  '--spacing-16': designTokens.spacing[16],
  '--spacing-20': designTokens.spacing[20],
  '--spacing-24': designTokens.spacing[24],
  '--spacing-32': designTokens.spacing[32],
  '--spacing-40': designTokens.spacing[40],
  '--spacing-48': designTokens.spacing[48],
  '--spacing-56': designTokens.spacing[56],
  '--spacing-64': designTokens.spacing[64],
  
  // Typography variables
  '--font-family-primary': designTokens.typography.fontFamily.primary,
  '--font-family-mono': designTokens.typography.fontFamily.mono,
  
  '--font-size-xs': designTokens.typography.fontSize.xs,
  '--font-size-sm': designTokens.typography.fontSize.sm,
  '--font-size-base': designTokens.typography.fontSize.base,
  '--font-size-lg': designTokens.typography.fontSize.lg,
  '--font-size-xl': designTokens.typography.fontSize.xl,
  '--font-size-2xl': designTokens.typography.fontSize['2xl'],
  '--font-size-3xl': designTokens.typography.fontSize['3xl'],
  '--font-size-4xl': designTokens.typography.fontSize['4xl'],
  '--font-size-5xl': designTokens.typography.fontSize['5xl'],
  '--font-size-6xl': designTokens.typography.fontSize['6xl'],
  
  '--font-weight-thin': designTokens.typography.fontWeight.thin,
  '--font-weight-light': designTokens.typography.fontWeight.light,
  '--font-weight-normal': designTokens.typography.fontWeight.normal,
  '--font-weight-medium': designTokens.typography.fontWeight.medium,
  '--font-weight-semibold': designTokens.typography.fontWeight.semibold,
  '--font-weight-bold': designTokens.typography.fontWeight.bold,
  '--font-weight-extrabold': designTokens.typography.fontWeight.extrabold,
  '--font-weight-black': designTokens.typography.fontWeight.black,
  
  '--line-height-tight': designTokens.typography.lineHeight.tight,
  '--line-height-snug': designTokens.typography.lineHeight.snug,
  '--line-height-normal': designTokens.typography.lineHeight.normal,
  '--line-height-relaxed': designTokens.typography.lineHeight.relaxed,
  '--line-height-loose': designTokens.typography.lineHeight.loose,
  
  '--letter-spacing-tighter': designTokens.typography.letterSpacing.tighter,
  '--letter-spacing-tight': designTokens.typography.letterSpacing.tight,
  '--letter-spacing-normal': designTokens.typography.letterSpacing.normal,
  '--letter-spacing-wide': designTokens.typography.letterSpacing.wide,
  '--letter-spacing-wider': designTokens.typography.letterSpacing.wider,
  '--letter-spacing-widest': designTokens.typography.letterSpacing.widest,
  
  // Border radius variables
  '--border-radius-none': designTokens.borderRadius.none,
  '--border-radius-sm': designTokens.borderRadius.sm,
  '--border-radius-base': designTokens.borderRadius.base,
  '--border-radius-md': designTokens.borderRadius.md,
  '--border-radius-lg': designTokens.borderRadius.lg,
  '--border-radius-xl': designTokens.borderRadius.xl,
  '--border-radius-2xl': designTokens.borderRadius['2xl'],
  '--border-radius-3xl': designTokens.borderRadius['3xl'],
  '--border-radius-full': designTokens.borderRadius.full,
  
  // Shadow variables
  '--shadow-sm': designTokens.shadows.sm,
  '--shadow-base': designTokens.shadows.base,
  '--shadow-md': designTokens.shadows.md,
  '--shadow-lg': designTokens.shadows.lg,
  '--shadow-xl': designTokens.shadows.xl,
  '--shadow-2xl': designTokens.shadows['2xl'],
  '--shadow-inner': designTokens.shadows.inner,
  '--shadow-none': designTokens.shadows.none,
  
  // Transition variables
  '--transition-duration-75': designTokens.transitions.duration[75],
  '--transition-duration-100': designTokens.transitions.duration[100],
  '--transition-duration-150': designTokens.transitions.duration[150],
  '--transition-duration-200': designTokens.transitions.duration[200],
  '--transition-duration-300': designTokens.transitions.duration[300],
  '--transition-duration-500': designTokens.transitions.duration[500],
  '--transition-duration-700': designTokens.transitions.duration[700],
  '--transition-duration-1000': designTokens.transitions.duration[1000],
  
  '--transition-easing-linear': designTokens.transitions.easing.linear,
  '--transition-easing-in': designTokens.transitions.easing.in,
  '--transition-easing-out': designTokens.transitions.easing.out,
  '--transition-easing-in-out': designTokens.transitions.easing.inOut,
};

export default designSystem;