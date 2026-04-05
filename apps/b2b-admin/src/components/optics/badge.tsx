import * as React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'raised' | 'secondary' | 'outline' | 'destructive' | 'ghost';
  render?: string;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', className = '', children, render, ...props }, ref) => {
    const variantClasses: Record<string, string> = {
      default: 'bg-primary text-primary-foreground shadow-sm',
      raised: 'bg-primary text-primary-foreground shadow-md',
      secondary: 'bg-secondary text-secondary-foreground',
      outline: 'border border-border text-foreground',
      destructive: 'bg-destructive text-destructive-foreground',
      ghost: 'text-muted-foreground hover:bg-muted',
    };

    const classes = [
      'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors',
      'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
      variantClasses[variant] ?? variantClasses.default,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    if (render) {
      return React.cloneElement((<>{render}</>) as any, { className: classes, ref, ...props });
    }

    return (
      <span ref={ref} className={classes} {...props}>
        {children}
      </span>
    );
  }
);
Badge.displayName = 'Badge';
