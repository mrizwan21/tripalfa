import * as React from 'react';

export interface ClusterProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  as?: React.ElementType;
}

export const Cluster = React.forwardRef<HTMLDivElement, ClusterProps>(
  ({ gap = 'md', as: Comp = 'div', className = '', children, ...props }, ref) => {
    const gapClass = gap !== 'md' ? ` gap-${gap}` : '';
    return (
      <Comp
        ref={ref}
        className={`op-cluster${gapClass}${className ? ` ${className}` : ''}`}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);
Cluster.displayName = 'Cluster';
