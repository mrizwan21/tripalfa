import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'default'
    | 'secondary'
    | 'outline'
    | 'info'
    | 'success'
    | 'warning'
    | 'muted'
    | 'ghost'
    | 'destructive'
    | 'raised'
    | 'link'
    | 'decorations';
  size?: 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg';
  loading?: boolean;
  render?: React.ReactElement;
  animation?: 'all' | 'none';
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'default',
      size,
      loading,
      disabled,
      className = '',
      children,
      render,
      animation = 'all',
      asChild,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center whitespace-nowrap rounded-md text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

    const variantClasses: Record<string, string> = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      info: 'bg-sky-500 text-white hover:bg-sky-600',
      success: 'bg-emerald-500 text-white hover:bg-emerald-600',
      warning: 'bg-amber-500 text-white hover:bg-amber-600',
      muted: 'bg-muted text-muted-foreground hover:bg-muted/80',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      raised: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md',
      link: 'text-primary underline-offset-4 hover:underline',
      decorations:
        'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm ring-1 ring-primary/20',
    };

    const sizeClasses: Record<string, string> = {
      sm: 'h-8 px-3 text-sm rounded-sm',
      lg: 'h-12 px-8 text-lg rounded-lg',
      icon: 'h-10 w-10 rounded-sm',
      'icon-sm': 'h-8 w-8 rounded-sm',
      'icon-lg': 'h-12 w-12 rounded-sm',
    };

    const classes = [
      baseClasses,
      variantClasses[variant] ?? variantClasses.default,
      size ? sizeClasses[size] : 'h-9 px-4 py-2',
      loading ? 'relative text-transparent pointer-events-none' : '',
      animation === 'none' ? '' : 'active:scale-[0.98]',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        className: classes,
        ref,
        ...props,
      });
    }

    if (render) {
      return React.cloneElement(render as React.ReactElement<any>, {
        className: classes,
        ref,
        ...props,
      });
    }

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {children}
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
          </span>
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';
