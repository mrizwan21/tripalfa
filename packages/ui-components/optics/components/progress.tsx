import * as React from 'react';

/**
 * Progress component — lightweight CSS-based progress bar.
 */

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  className?: string;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ value = 0, max = 100, className = '', ...props }, ref) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className={`progress${className ? ` ${className}` : ''}`}
        {...props}
      >
        <div className="progress__bar" style={{ width: `${percentage}%` }} />
      </div>
    );
  }
);
Progress.displayName = 'Progress';
