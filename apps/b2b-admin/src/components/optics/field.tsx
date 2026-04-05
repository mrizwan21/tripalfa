import * as React from 'react';
export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
}
export const Field = React.forwardRef<HTMLDivElement, FieldProps>(
  ({ label, error, required, htmlFor, className = '', children, ...props }, ref) => (
    <div ref={ref} className={`space-y-2 ${className}`} {...props}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
);
Field.displayName = 'Field';
