import * as React from 'react';

export interface AlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  variant?: 'warning' | 'danger' | 'info' | 'notice';
  appearance?: 'default' | 'muted' | 'filled';
  flash?: boolean;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    { variant = 'info', appearance = 'default', flash = false, className = '', children, ...props },
    ref
  ) => {
    const classes = ['alert'];
    if (variant) classes.push(`alert--${variant}`);
    if (appearance !== 'default') classes.push(`alert--${appearance}`);
    if (flash) classes.push('alert--flash');
    if (className) classes.push(className);

    const alertRole = variant === 'danger' || variant === 'warning' ? 'alert' : 'status';

    return (
      <div ref={ref} className={classes.join(' ')} role={alertRole} aria-live="polite" {...props}>
        {children}
      </div>
    );
  }
);
Alert.displayName = 'Alert';
