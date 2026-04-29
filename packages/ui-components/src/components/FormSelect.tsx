import * as React from "react";
import { cn } from "../lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { ChevronDown } from "lucide-react";

export type FormSelectVariant = "b2b" | "b2c" | "admin";
export type FormSelectDensity = "compact" | "normal" | "comfortable";

export interface FormSelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  description?: string;
}

export interface FormSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement>,
    VariantProps<typeof selectVariants> {
  placeholder?: string;
  options: FormSelectOption[];
  label?: string;
  description?: string;
  error?: string;
  successMessage?: string;
  touched?: boolean;
  containerClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
  successClassName?: string;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  helperText?: string;
  required?: boolean;
}

const selectVariants = cva(
  "flex h-10 w-full appearance-none rounded-md border border-black/10 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-near-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors pr-8",
  {
    variants: {
      variant: {
        b2b: "border-near-black focus-visible:ring-apple-blue",
        b2c: "border-near-black focus-visible:ring-apple-blue",
        admin: "border-near-black focus-visible:ring-apple-blue",
      },
      density: {
        compact: "h-8 px-2 py-1 text-xs",
        normal: "h-10 px-3 py-2 text-sm",
        comfortable: "h-12 px-4 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "b2b",
      density: "normal",
    },
  }
);

const densityStyles = {
  compact: { label: "text-xs font-medium", container: "gap-1" },
  normal: { label: "text-sm font-medium", container: "gap-2" },
  comfortable: { label: "text-base font-medium", container: "gap-3" },
};

export const FormSelect = React.forwardRef<
  HTMLSelectElement,
  FormSelectProps
>(
  (
    {
      options = [],
      label,
      description,
      error,
      successMessage,
      touched = false,
      variant = "b2b",
      density = "normal",
      containerClassName,
      labelClassName,
      errorClassName,
      successClassName,
      prefixIcon,
      suffixIcon,
      helperText,
      required = false,
      disabled = false,
      className,
      ...props
    },
    ref
  ) => {
    const styles = densityStyles[density || "normal"];

    return (
      <div
        className={cn(
          "flex flex-col",
          styles.container,
          containerClassName
        )}
      >
        {label && (
          <label
            className={cn(
              styles.label,
              "text-near-black font-semibold",
              required && "after:content-['*'] after:ml-1 after:text-near-black",
              labelClassName
            )}
            htmlFor={props.id}
          >
            {label}
          </label>
        )}

        {description && (
          <p className={cn("text-xs text-near-black", density === "compact" && "hidden")}>
            {description}
          </p>
        )}

        <div className="relative">
          {prefixIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-near-black pointer-events-none">
              {prefixIcon}
            </div>
          )}

          <select
            ref={ref}
            disabled={disabled}
            className={cn(
              selectVariants({ variant, density }),
              error && touched && "border-near-black focus-visible:ring-near-black",
              successMessage && touched && "border-apple-blue focus-visible:ring-apple-blue",
              prefixIcon && "pl-10",
              className
            )}
            {...props}
          >
            {props.placeholder && (
              <option value="" disabled>
                {props.placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={`${option.value}`}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          {/* Chevron icon */}
          <ChevronDown
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 text-near-black pointer-events-none",
              density === "compact" && "h-3 w-3",
              density === "normal" && "h-4 w-4",
              density === "comfortable" && "h-5 w-5"
            )}
          />
        </div>

        {helperText && !error && !successMessage && (
          <p className={cn("text-xs text-near-black")}>
            {helperText}
          </p>
        )}

        {error && touched && (
          <p
            className={cn(
              "text-xs font-medium text-near-black",
              errorClassName
            )}
          >
            {error}
          </p>
        )}

        {successMessage && touched && (
          <p
            className={cn(
              "text-xs font-medium text-apple-blue",
              successClassName
            )}
          >
            {successMessage}
          </p>
        )}
      </div>
    );
  }
);

FormSelect.displayName = "FormSelect";
