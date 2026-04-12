import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@tripalfa/shared-utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-blue-50 text-blue-700',
        secondary: 'border-transparent bg-neutral-100 text-neutral-700',
        success: 'border-transparent bg-blue-50 text-blue-700',
        warning: 'border-transparent bg-neutral-100 text-neutral-700',
        destructive: 'border-transparent bg-neutral-200 text-neutral-500',
        outline: 'border-neutral-200 text-neutral-600 bg-white',
        ghost: 'border-transparent text-neutral-500',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  children?: React.ReactNode;
  className?: string;
}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...(props as any)} />;
}

export { Badge, badgeVariants };
