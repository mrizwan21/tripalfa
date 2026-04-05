import * as React from 'react';

export interface TooltipProps extends React.HTMLAttributes<HTMLDivElement> {
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  ({ text, position = 'top', className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`tooltip-wrapper${className ? ` ${className}` : ''}`}
        data-tooltip={text}
        data-tooltip-position={position}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Tooltip.displayName = 'Tooltip';
