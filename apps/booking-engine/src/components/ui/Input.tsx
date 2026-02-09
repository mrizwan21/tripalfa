import * as React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  inputSize?: 'sm' | 'md' | 'lg';
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, inputSize = 'md', ...props }, ref) => {
    const sizeClass = inputSize === 'sm' ? 'input-sm' : inputSize === 'lg' ? 'input-lg' : '';
    
    return (
      <input
        type={type}
        className={cn('input', sizeClass, className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
