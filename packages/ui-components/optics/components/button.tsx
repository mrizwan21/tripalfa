import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: string;
  size?: string;
  pill?: boolean;
  icon?: boolean;
  iconWithLabel?: boolean;
  noBorder?: boolean;
  active?: boolean;
  loading?: boolean;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant,
      size = 'large',
      pill = false,
      icon = false,
      iconWithLabel = false,
      noBorder = false,
      active = false,
      loading = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const classes = ['btn'];
    if (variant) classes.push(`btn--${variant}`);
    if (size !== 'large') classes.push(`btn--${size}`);
    if (pill) classes.push('btn--pill');
    if (icon) classes.push('btn--icon');
    if (iconWithLabel) classes.push('btn--icon-with-label');
    if (noBorder) classes.push('btn--no-border');
    if (active) classes.push('btn--active');
    if (loading) classes.push('btn--loading');
    if (className) classes.push(className);

    return (
      <button
        ref={ref}
        className={classes.join(' ')}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
