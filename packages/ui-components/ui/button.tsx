import * as React from 'react';
import { cn } from '@tripalfa/shared-utils';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center text-base font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] gap-2',
  {
    variants: {
      variant: {
        default:
          'bg-[hsl(var(--brand-primary))] text-[hsl(var(--brand-primary-foreground))] shadow-sm hover:opacity-90 border border-transparent',

        secondary:
          'bg-[hsl(var(--brand-secondary))] text-[hsl(var(--brand-secondary-foreground))] shadow-sm hover:opacity-80 border border-transparent',

        outline:
          'border border-[hsl(var(--border))] bg-transparent text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] hover:border-[hsl(var(--border))]',

        ghost:
          'bg-transparent text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]',

        link: 'bg-transparent text-[hsl(var(--brand-primary))] underline-offset-4 hover:underline hover:text-[hsl(var(--brand-primary))]',

        destructive:
          'bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] shadow-sm hover:opacity-90 border border-transparent',

        success:
          'bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] shadow-sm hover:opacity-90 border border-transparent',

        warning:
          'bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))] shadow-sm hover:opacity-90 border border-transparent',
      },
      size: {
        sm: 'h-8 px-3 text-sm rounded',
        default: 'h-10 px-4 text-base rounded',
        lg: 'h-12 px-6 text-lg rounded-md',
        icon: 'h-10 w-10 p-0 rounded',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
