import * as React from 'react';
export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {}
export const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className = '', ...props }, ref) => (
    <div ref={ref} className={`inline-flex ${className}`} role="group" {...props} />
  )
);
ButtonGroup.displayName = 'ButtonGroup';
