import * as React from 'react';
export interface ItemProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
}
export const Item = React.forwardRef<HTMLDivElement, ItemProps>(
  ({ icon, title, description, className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={`flex items-center gap-3 rounded-lg border p-3 ${className}`}
      {...props}
    >
      {icon && (
        <div className="flex h-9 w-9 items-center justify-center rounded-md border bg-muted">
          {icon}
        </div>
      )}
      <div className="flex-1">
        {title && <div className="text-sm font-medium">{title}</div>}
        {description && <div className="text-xs text-muted-foreground">{description}</div>}
        {children}
      </div>
    </div>
  )
);
Item.displayName = 'Item';
