import * as React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'danger' | 'warning' | 'info' | 'notice';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant, className = '', children, ...props }, ref) => {
    const classes = ['badge'];
    if (variant) classes.push(`badge--${variant}`);
    if (className) classes.push(className);

    return (
      <span ref={ref} className={classes.join(' ')} {...props}>
        {children}
      </span>
    );
  }
);
Badge.displayName = 'Badge';
