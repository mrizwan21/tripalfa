/**
 * SCSS variables for Apple-inspired design system
 */

import { tokens } from './tokens';

export const scssVariables = {
  // Color Variables
  '$apple-blue': tokens.colors.appleBlue,
  '$link-blue': tokens.colors.linkBlue,
  '$bright-blue': tokens.colors.brightBlue,
  '$pure-black': tokens.colors.pureBlack,
  '$light-gray': tokens.colors.lightGray,
  '$near-black': tokens.colors.nearBlack,
  '$white': tokens.colors.white,
  '$text-primary-light': tokens.colors.textPrimaryLight,
  '$text-tertiary-light': tokens.colors.textTertiaryLight,
  '$text-primary-dark': tokens.colors.textPrimaryDark,
  '$dark-surface-1': tokens.colors.darkSurface1,
  '$dark-surface-2': tokens.colors.darkSurface2,
  '$dark-surface-3': tokens.colors.darkSurface3,
  '$dark-surface-4': tokens.colors.darkSurface4,
  '$dark-surface-5': tokens.colors.darkSurface5,
  '$button-active': tokens.colors.buttonActive,
  '$button-default-light': tokens.colors.buttonDefaultLight,
  '$overlay': tokens.colors.overlay,
  '$white-32': tokens.colors.white32,
  '$primary': tokens.colors.primary,
  '$secondary': tokens.colors.secondary,
  '$success': tokens.colors.success,
  '$warning': tokens.colors.warning,
  '$error': tokens.colors.error,
  '$info': tokens.colors.info,

  // Typography Variables
  '$font-display': tokens.typography.fontFamily.display,
  '$font-body': tokens.typography.fontFamily.body,
  '$font-mono': tokens.typography.fontFamily.mono,

  // Font Size Variables
  '$font-size-display-hero': tokens.typography.fontSize.displayHero,
  '$font-size-section-heading': tokens.typography.fontSize.sectionHeading,
  '$font-size-tile-heading': tokens.typography.fontSize.tileHeading,
  '$font-size-card-title': tokens.typography.fontSize.cardTitle,
  '$font-size-sub-heading': tokens.typography.fontSize.subHeading,
  '$font-size-nav-heading': tokens.typography.fontSize.navHeading,
  '$font-size-sub-nav': tokens.typography.fontSize.subNav,
  '$font-size-body': tokens.typography.fontSize.body,
  '$font-size-body-emphasis': tokens.typography.fontSize.bodyEmphasis,
  '$font-size-button-large': tokens.typography.fontSize.buttonLarge,
  '$font-size-button': tokens.typography.fontSize.button,
  '$font-size-link': tokens.typography.fontSize.link,
  '$font-size-caption': tokens.typography.fontSize.caption,
  '$font-size-caption-bold': tokens.typography.fontSize.captionBold,
  '$font-size-micro': tokens.typography.fontSize.micro,
  '$font-size-micro-bold': tokens.typography.fontSize.microBold,
  '$font-size-nano': tokens.typography.fontSize.nano,

  // Font Weight Variables
  '$font-weight-light': tokens.typography.fontWeight.light,
  '$font-weight-regular': tokens.typography.fontWeight.regular,
  '$font-weight-medium': tokens.typography.fontWeight.medium,
  '$font-weight-semibold': tokens.typography.fontWeight.semibold,
  '$font-weight-bold': tokens.typography.fontWeight.bold,

  // Line Height Variables
  '$line-height-tight': tokens.typography.lineHeight.tight,
  '$line-height-normal': tokens.typography.lineHeight.normal,
  '$line-height-relaxed': tokens.typography.lineHeight.relaxed,

  // Letter Spacing Variables
  '$letter-spacing-tight': tokens.typography.letterSpacing.tight,
  '$letter-spacing-normal': tokens.typography.letterSpacing.normal,
  '$letter-spacing-loose': tokens.typography.letterSpacing.loose,

  // Spacing Variables
  '$spacing-xs': tokens.spacing.xs,
  '$spacing-sm': tokens.spacing.sm,
  '$spacing-md': tokens.spacing.md,
  '$spacing-lg': tokens.spacing.lg,
  '$spacing-xl': tokens.spacing.xl,
  '$spacing-xxl': tokens.spacing.xxl,
  '$spacing-xxxl': tokens.spacing.xxxl,

  // Border Radius Variables
  '$radius-sm': tokens.borderRadius.sm,
  '$radius-md': tokens.borderRadius.md,
  '$radius-lg': tokens.borderRadius.lg,
  '$radius-xl': tokens.borderRadius.xl,
  '$radius-pill': tokens.borderRadius.pill,
  '$radius-full': tokens.borderRadius.full,

  // Shadow Variables
  '$shadow-card': tokens.shadows.card,
  '$shadow-dropdown': tokens.shadows.dropdown,
  '$shadow-focus': tokens.shadows.focus,

  // Breakpoint Variables
  '$breakpoint-xs': tokens.breakpoints.xs,
  '$breakpoint-sm': tokens.breakpoints.sm,
  '$breakpoint-md': tokens.breakpoints.md,
  '$breakpoint-lg': tokens.breakpoints.lg,
  '$breakpoint-xl': tokens.breakpoints.xl,
  '$breakpoint-xxl': tokens.breakpoints.xxl,

  // Z-Index Variables
  '$z-index-base': tokens.zIndex.base.toString(),
  '$z-index-dropdown': tokens.zIndex.dropdown.toString(),
  '$z-index-sticky': tokens.zIndex.sticky.toString(),
  '$z-index-modal-backdrop': tokens.zIndex.modalBackdrop.toString(),
  '$z-index-modal': tokens.zIndex.modal.toString(),
  '$z-index-popover': tokens.zIndex.popover.toString(),
  '$z-index-tooltip': tokens.zIndex.tooltip.toString(),
  '$z-index-toast': tokens.zIndex.toast.toString(),

  // Animation Variables
  '$animation-duration-fast': tokens.animation.duration.fast,
  '$animation-duration-normal': tokens.animation.duration.normal,
  '$animation-duration-slow': tokens.animation.duration.slow,
  '$animation-easing-ease-in-out': tokens.animation.easing.easeInOut,
  '$animation-easing-ease-out': tokens.animation.easing.easeOut,
  '$animation-easing-ease-in': tokens.animation.easing.easeIn,
} as const;

/**
 * Generates SCSS variables as a string
 */
export function generateSCSSVariables(): string {
  const lines = Object.entries(scssVariables).map(([key, value]) => {
    return `${key}: ${value};`;
  });

  return lines.join('\n');
}

/**
 * SCSS variable names as TypeScript type
 */
export type SCSSVariable = keyof typeof scssVariables;