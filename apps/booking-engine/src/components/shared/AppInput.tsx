import React from 'react';
import { cn } from '@tripalfa/ui-components';

/**
 * Standardized input wrapper component for OTA-style design.
 *
 * Provides consistent:
 * - Label styling
 * - Input height (57px on desktop, 48px on mobile)
 * - Focus states
 * - Error states
 * - Disabled states
 */

export interface AppInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  labelIcon?: React.ReactNode;
  error?: string;
  helperText?: string;
  className?: string;
  inputClassName?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
};

export const AppInput = React.forwardRef<HTMLInputElement, AppInputProps>(
  ({ label, labelIcon, error, helperText, className, inputClassName, size = 'md', ...props }, ref) => {
    return (
      <div className={cn('w-full', className)}>
        {label && (
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
            {labelIcon}
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full h-12 lg:h-14 rounded-xl border border-gray-200 bg-white text-gray-900',
            'placeholder:text-gray-400',
            'transition-all duration-200',
            'hover:border-gray-300',
            'focus:border-[#003b95] focus:ring-2 focus:ring-[#003b95]/10 focus:outline-none',
            'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/10',
            sizeClasses[size],
            inputClassName,
          )}
          {...props}
        />
        {helperText && !error && (
          <p className="mt-1.5 text-xs text-gray-500">{helperText}</p>
        )}
        {error && <p className="mt-1.5 text-xs text-red-600 font-medium">{error}</p>}
      </div>
    );
  }
);
AppInput.displayName = 'AppInput';
