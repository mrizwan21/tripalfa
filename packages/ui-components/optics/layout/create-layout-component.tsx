import * as React from 'react';

export interface LayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  as?: React.ElementType;
}

/**
 * Factory function to create layout primitive components with shared logic.
 * Eliminates duplication between Stack, Cluster, and Split components.
 */
export function createLayoutComponent(
  displayName: string,
  baseClass: string
) {
  const Component = React.forwardRef<HTMLDivElement, LayoutProps>(
    ({ gap = 'md', as: Comp = 'div', className = '', children, ...props }, ref) => {
      const gapClass = gap !== 'md' ? ` gap-${gap}` : '';
      return (
        <Comp
          ref={ref}
          className={`${baseClass}${gapClass}${className ? ` ${className}` : ''}`}
          {...props}
        >
          {children}
        </Comp>
      );
    }
  );
  Component.displayName = displayName;
  return Component;
}