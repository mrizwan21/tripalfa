import * as React from 'react';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'default' | 'sm' | 'xs';
  padding?: 'default' | 'md' | 'sm';
  as?: React.ElementType;
}

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  (
    { size = 'default', padding = 'default', as: Comp = 'div', className = '', children, ...props },
    ref
  ) => {
    const classes = ['container'];
    if (size === 'sm') classes.push('container--sm');
    if (size === 'xs') classes.push('container--xs');
    if (padding === 'md') classes.push('container--md-padding');
    if (padding === 'sm') classes.push('container--sm-padding');
    if (className) classes.push(className);

    return (
      <Comp ref={ref} className={classes.join(' ')} {...props}>
        {children}
      </Comp>
    );
  }
);
Container.displayName = 'Container';
