import * as React from 'react';
export const Form = React.forwardRef<HTMLFormElement, React.FormHTMLAttributes<HTMLFormElement>>(
  ({ className = '', ...props }, ref) => <form ref={ref} className={className} {...props} />
);
Form.displayName = 'Form';
export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  control?: any;
  name?: string;
  render?: (props: { field: any }) => React.ReactNode;
  onValueChange?: (value: any) => void;
}
export const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className = '', control, name, render, onValueChange, ...props }, ref) => {
    if (render) {
      return (
        <>
          {render({
            field: {
              value: '',
              onChange: (...args: any[]) => {
                if (onValueChange) onValueChange(args[0] ?? args);
              },
              name: name ?? '',
            },
          })}
        </>
      );
    }
    return <div ref={ref} className={`space-y-2 ${className}`} {...props} />;
  }
);
FormField.displayName = 'FormField';
export const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div ref={ref} className={`space-y-2 ${className}`} {...props} />
  )
);
FormItem.displayName = 'FormItem';
export const FormLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className = '', ...props }, ref) => (
  <label ref={ref} className={`text-sm font-medium leading-none ${className}`} {...props} />
));
FormLabel.displayName = 'FormLabel';
export const FormControl = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  (props, ref) => <div ref={ref} {...props} />
);
FormControl.displayName = 'FormControl';
export const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className = '', ...props }, ref) => (
  <p ref={ref} className={`text-sm text-muted-foreground ${className}`} {...props} />
));
FormDescription.displayName = 'FormDescription';
export const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className = '', ...props }, ref) => (
  <p
    ref={ref}
    className={`text-sm font-medium text-destructive ${className}`}
    role="alert"
    {...props}
  />
));
FormMessage.displayName = 'FormMessage';
export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className = '', ...props }, ref) => (
  <label
    ref={ref}
    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
    {...props}
  />
));
Label.displayName = 'Label';
