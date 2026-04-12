// @ts-ignore
import * as React from 'react';

import { cn } from '@tripalfa/shared-utils';

/* ============================================
   INPUT DESIGN TOKENS - STANDARDIZED STYLING
   ============================================ */
const inputTokens = {
  heights: {
    sm: '2rem' /* 32px */,
    default: '2.5rem' /* 40px */,
    lg: '3rem' /* 48px */,
  },
  padding: {
    sm: '0.5rem' /* 8px */,
    default: '0.75rem' /* 12px */,
    lg: '1rem' /* 16px */,
  },
  fontSize: {
    sm: '0.8125rem' /* 13px */,
    default: '0.875rem' /* 14px */,
    lg: '0.9375rem' /* 15px */,
  },
} as const;

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  inputSize?: 'sm' | 'default' | 'lg';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, inputSize = 'default', ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex w-full rounded-lg border border-border bg-background px-3 py-2 text-base',
          'ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted',
          'hover:border-muted-foreground/30 transition-colors duration-200',
          className
        )}
        style={
          {
            height: inputTokens.heights[inputSize],
            paddingLeft: inputTokens.padding[inputSize],
            paddingRight: inputTokens.padding[inputSize],
            fontSize: inputTokens.fontSize[inputSize],
          } as React.CSSProperties
        }
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
