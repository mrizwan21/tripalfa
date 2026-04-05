import * as React from 'react';

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  as?: React.ElementType;
}

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ gap = 'md', as: Comp = 'div', className = '', children, ...props }, ref) => {
    const gapClass = gap !== 'md' ? ` gap-${gap}` : '';
    return (
      <Comp
        ref={ref}
        className={`op-stack${gapClass}${className ? ` ${className}` : ''}`}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);
Stack.displayName = 'Stack';
