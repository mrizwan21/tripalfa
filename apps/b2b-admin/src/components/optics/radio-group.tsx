import * as React from 'react';
export interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  onValueChange?: (value: string) => void;
}
export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ value, onValueChange, className = '', children, ...props }, ref) => (
    <div ref={ref} className={`grid gap-2 ${className}`} role="radiogroup" {...props}>
      {children}
    </div>
  )
);
RadioGroup.displayName = 'RadioGroup';
export interface RadioGroupItemProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type'
> {
  value: string;
}
export const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className = '', ...props }, ref) => (
    <input
      ref={ref}
      type="radio"
      className={`aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:ring-1 focus:ring-ring ${className}`}
      {...props}
    />
  )
);
RadioGroupItem.displayName = 'RadioGroupItem';
