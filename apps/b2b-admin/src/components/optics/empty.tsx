import * as React from 'react';
export interface EmptyProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
}
export const Empty = React.forwardRef<HTMLDivElement, EmptyProps>(
  ({ icon, title, description, className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={`flex flex-col items-center justify-center gap-2 py-12 text-center ${className}`}
      {...props}
    >
      {icon && <div className="text-muted-foreground">{icon}</div>}
      {title && <h3 className="text-lg font-semibold">{title}</h3>}
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {children}
    </div>
  )
);
Empty.displayName = 'Empty';
