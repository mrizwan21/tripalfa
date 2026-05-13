import React, { type ElementType } from 'react';
import { cn } from '@tripalfa/ui-components';

/**
 * Standardized card component for consistent design across all pages.
 *
 * Usage:
 * <AppCard variant="elevated"> ... </AppCard>
 * <AppCard variant="flat"> ... </AppCard>
 * <AppCard variant="outline"> ... </AppCard>
 * <AppCard variant="shadow"> ... </AppCard>
 * <AppCard variant="glass" as="section"> ... </AppCard>
 * <AppCard variant="gradient" className="from-[#003b95] to-[#002a6e]"> ... </AppCard>
 */

export type CardVariant = 'elevated' | 'flat' | 'outline' | 'shadow' | 'glass' | 'gradient';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';
export type CardRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

interface AppCardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  radius?: CardRadius;
  className?: string;
  as?: ElementType;
  onClick?: () => void;
  href?: string;
}

const variantClasses: Record<CardVariant, string> = {
  elevated:
    'bg-white border border-gray-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300',
  flat: 'bg-white border border-gray-100',
  outline: 'bg-transparent border border-gray-200 hover:border-gray-300 transition-colors',
  shadow: 'bg-white shadow-md hover:shadow-lg transition-shadow duration-300',
  glass: 'bg-white/80 backdrop-blur-md border border-white/20 shadow-lg',
  gradient: 'bg-gradient-to-br border-0 shadow-lg',
};

const paddingClasses: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
};

const radiusClasses: Record<CardRadius, string> = {
  none: 'rounded-none',
  sm: 'rounded',
  md: 'rounded-lg',
  lg: 'rounded-xl',
  xl: 'rounded-2xl',
  '2xl': 'rounded-3xl',
  full: 'rounded-full',
};

export const AppCard = React.forwardRef<HTMLDivElement, AppCardProps>(
  ({ children, variant = 'elevated', padding = 'md', radius = 'lg', className, as, onClick, href }, ref) => {
    const Tag = (as || (href ? 'a' : 'div')) as any;

    return (
      <Tag
        ref={ref}
        {...(href ? { href } : {})}
        onClick={onClick}
        className={cn(
          variantClasses[variant],
          paddingClasses[padding],
          radiusClasses[radius],
          'overflow-hidden',
          onClick && 'cursor-pointer',
          className,
        )}
      >
        {children}
      </Tag>
    );
  }
);
AppCard.displayName = 'AppCard';
