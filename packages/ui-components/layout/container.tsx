import * as React from 'react';
import { cn } from '@tripalfa/shared-utils';

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  size?: 'default' | 'lg';
}

const maxWidthMap: Record<NonNullable<PageContainerProps['maxWidth']>, string> = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full',
};

const PageContainer = React.forwardRef<HTMLDivElement, PageContainerProps>(
  ({ className, maxWidth = 'xl', size = 'default', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'mx-auto w-full',
        maxWidthMap[maxWidth],
        size === 'default' && 'px-page-x py-page-y',
        size === 'lg' && 'px-page-x-lg py-page-y-lg',
        className
      )}
      {...props}
    />
  )
);
PageContainer.displayName = 'PageContainer';

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  spacing?: 'default' | 'lg';
}

const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ className, spacing = 'default', ...props }, ref) => (
    <section
      ref={ref}
      className={cn(
        spacing === 'default' && 'mb-section',
        spacing === 'lg' && 'mb-section-lg',
        className
      )}
      {...props}
    />
  )
);
Section.displayName = 'Section';

export { PageContainer, Section };
export type { PageContainerProps, SectionProps };
