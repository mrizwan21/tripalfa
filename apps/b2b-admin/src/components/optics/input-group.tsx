import * as React from 'react';
export interface InputGroupProps extends React.HTMLAttributes<HTMLDivElement> {}
export const InputGroup = React.forwardRef<HTMLDivElement, InputGroupProps>(
  ({ className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`flex items-center rounded-md border shadow-sm ${className}`}
      {...props}
    />
  )
);
InputGroup.displayName = 'InputGroup';
export const InputGroupAddon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', ...props }, ref) => (
  <div
    ref={ref}
    className={`flex items-center px-3 text-muted-foreground ${className}`}
    {...props}
  />
));
InputGroupAddon.displayName = 'InputGroupAddon';
export const InputGroupInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className = '', ...props }, ref) => (
  <input
    ref={ref}
    className={`flex h-9 w-full bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground ${className}`}
    {...props}
  />
));
InputGroupInput.displayName = 'InputGroupInput';
