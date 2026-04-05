import * as React from 'react';
export interface ResizableProps extends React.HTMLAttributes<HTMLDivElement> {}
export const Resizable = React.forwardRef<HTMLDivElement, ResizableProps>(
  ({ className = '', ...props }, ref) => (
    <div ref={ref} className={`flex h-full w-full ${className}`} {...props} />
  )
);
Resizable.displayName = 'Resizable';
export const ResizablePanel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', ...props }, ref) => (
  <div ref={ref} className={`flex-1 ${className}`} {...props} />
));
ResizablePanel.displayName = 'ResizablePanel';
export const ResizableHandle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', ...props }, ref) => (
  <div
    ref={ref}
    className={`w-px bg-border cursor-col-resize hover:bg-primary ${className}`}
    {...props}
  />
));
ResizableHandle.displayName = 'ResizableHandle';
