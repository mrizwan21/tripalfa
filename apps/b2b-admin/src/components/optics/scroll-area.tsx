import * as React from 'react';
export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {}
export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className = '', ...props }, ref) => (
    <div ref={ref} className={`relative overflow-auto ${className}`} {...props} />
  )
);
ScrollArea.displayName = 'ScrollArea';
export const ScrollBar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div ref={ref} className={`hidden ${className}`} {...props} />
  )
);
ScrollBar.displayName = 'ScrollBar';
