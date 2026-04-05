import * as React from 'react';
export interface ToggleGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string[];
  onValueChange?: (value: string[]) => void;
  type?: 'single' | 'multiple';
}
export const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(
  ({ value = [], onValueChange, type = 'single', className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={`inline-flex rounded-lg bg-muted p-1 ${className}`}
      role="group"
      {...props}
    >
      {children}
    </div>
  )
);
ToggleGroup.displayName = 'ToggleGroup';
export interface ToggleGroupItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}
export const ToggleGroupItem = React.forwardRef<HTMLButtonElement, ToggleGroupItemProps>(
  ({ value, className = '', ...props }, ref) => (
    <button
      ref={ref}
      data-state="off"
      className={`inline-flex items-center justify-center rounded-md px-3 py-1 text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm ${className}`}
      {...props}
    />
  )
);
ToggleGroupItem.displayName = 'ToggleGroupItem';
