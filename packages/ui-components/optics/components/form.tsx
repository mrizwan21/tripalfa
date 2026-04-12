import * as React from 'react';

/**
 * Shared class builder for form input elements.
 * Eliminates duplication between Input, Textarea, and Select components.
 */
function buildInputClasses(
  inputSize?: 'small' | 'medium' | 'large',
  error?: boolean,
  className?: string,
): string {
  const classes = ['input'];
  if (inputSize) classes.push(`input--${inputSize}`);
  if (error) classes.push('input--error');
  if (className) classes.push(className);
  return classes.join(' ');
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  inputSize?: 'small' | 'medium' | 'large';
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ inputSize, error, className = '', ...props }, ref) => {
    return <input ref={ref} className={buildInputClasses(inputSize, error, className)} {...props} />;
  }
);
Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  inputSize?: 'small' | 'medium' | 'large';
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ inputSize, error, className = '', ...props }, ref) => {
    return <textarea ref={ref} className={buildInputClasses(inputSize, error, className)} {...props} />;
  }
);
Textarea.displayName = 'Textarea';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  inputSize?: 'small' | 'medium' | 'large';
  error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ inputSize, error, className = '', children, ...props }, ref) => {
    return (
      <select ref={ref} className={buildInputClasses(inputSize, error, className)} {...props}>
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
}

export const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, error, required, htmlFor, className = '', children, ...props }, ref) => {
    const classes = ['form-group'];
    if (error) classes.push('form-group--error');
    if (className) classes.push(className);

    return (
      <div ref={ref} className={classes.join(' ')} {...props}>
        {label && (
          <label
            className={`form-label${required ? ' form-label--required' : ''}`}
            htmlFor={htmlFor}
          >
            {label}
          </label>
        )}
        {children}
        {error && (
          <span className="form-error" role="alert" aria-live="assertive">
            {error}
          </span>
        )}
      </div>
    );
  }
);
FormField.displayName = 'FormField';