import * as React from 'react';

export interface DividerProps extends React.HTMLAttributes<HTMLHRElement> {
  vertical?: boolean;
}

export const Divider = React.forwardRef<HTMLHRElement, DividerProps>(
  ({ vertical = false, className = '', ...props }, ref) => {
    const classes = ['divider'];
    if (vertical) classes.push('divider--vertical');
    if (className) classes.push(className);

    return <hr ref={ref} className={classes.join(' ')} {...props} />;
  }
);
Divider.displayName = 'Divider';
