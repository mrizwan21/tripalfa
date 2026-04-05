import * as React from 'react';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'small' | 'medium' | 'large';
}

export const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ size, className = '', ...props }, ref) => {
    const classes = ['spinner'];
    if (size) classes.push(`spinner--${size}`);
    if (className) classes.push(className);

    return <div ref={ref} className={classes.join(' ')} role="status" {...props} />;
  }
);
Spinner.displayName = 'Spinner';
