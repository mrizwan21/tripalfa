import * as React from 'react';

export interface SplitProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  as?: React.ElementType;
}

export const Split = React.forwardRef<HTMLDivElement, SplitProps>(
  ({ gap = 'md', as: Comp = 'div', className = '', children, ...props }, ref) => {
    const gapClass = gap !== 'md' ? ` gap-${gap}` : '';
    return (
      <Comp
        ref={ref}
        className={`op-split${gapClass}${className ? ` ${className}` : ''}`}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);
Split.displayName = 'Split';
