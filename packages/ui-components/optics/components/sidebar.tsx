import * as React from 'react';

export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  mode?: 'drawer' | 'compact' | 'rail';
  colorVariant?: 'primary' | 'neutral';
}

export const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(
  ({ mode, colorVariant, className = '', children, ...props }, ref) => {
    const classes = ['sidebar'];
    if (mode) classes.push(`sidebar--${mode}`);
    if (colorVariant) classes.push(`sidebar--${colorVariant}`);
    if (className) classes.push(className);

    return (
      <aside ref={ref} className={classes.join(' ')} {...props}>
        {children}
      </aside>
    );
  }
);
Sidebar.displayName = 'Sidebar';
