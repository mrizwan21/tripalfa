import * as React from "react";
import { cn } from "../lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Check } from "lucide-react";

export type CheckboxVariant = "b2b" | "b2c" | "admin";
export type CheckboxDensity = "compact" | "normal" | "comfortable";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">,
    VariantProps<typeof checkboxVariants> {
  label?: string;
  description?: string;
  error?: string;
  successMessage?: string;
  touched?: boolean;
  containerClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
  successClassName?: string;
  helperText?: string;
  required?: boolean;
  indeterminate?: boolean;
  onCheck?: (checked: boolean) => void;
}

const checkboxVariants = cva(
  "relative inline-flex shrink-0 cursor-pointer appearance-none rounded border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        b2b: "border-near-black bg-white focus-visible:ring-apple-blue focus-visible:ring-offset-white checked:bg-apple-blue checked:border-apple-blue",
        b2c: "border-near-black bg-white focus-visible:ring-apple-blue focus-visible:ring-offset-white checked:bg-apple-blue checked:border-apple-blue",
        admin: "border-near-black bg-white focus-visible:ring-apple-blue focus-visible:ring-offset-white checked:bg-near-black checked:border-near-black",
      },
      density: {
        compact: "h-4 w-4",
        normal: "h-5 w-5",
        comfortable: "h-6 w-6",
      },
    },
    defaultVariants: {
      variant: "b2b",
      density: "normal",
    },
  }
);

const densityStyles = {
  compact: { label: "text-xs font-medium", container: "gap-1", icon: "h-3 w-3" },
  normal: { label: "text-sm font-medium", container: "gap-2", icon: "h-4 w-4" },
  comfortable: { label: "text-base font-medium", container: "gap-3", icon: "h-5 w-5" },
};

export const Checkbox = React.forwardRef<
  HTMLInputElement,
  CheckboxProps
>(
  (
    {
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
      helperText,
      required = false,
      disabled = false,
      indeterminate = false,
      className,
      checked,
      onCheck,
      onChange,
      ...props
    },
    ref
  ) => {
    const styles = densityStyles[density || "normal"];
    const [isChecked, setIsChecked] = React.useState(checked || false);
    const internalRef = React.useRef<HTMLInputElement>(null);

    // Handle indeterminate state
    React.useEffect(() => {
      if (internalRef.current) {
        internalRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = e.target.checked;
      setIsChecked(newChecked);
      onCheck?.(newChecked);
      onChange?.(e);
    };

    React.useEffect(() => {
      if (checked !== undefined) {
        setIsChecked(checked);
      }
    }, [checked]);

    const combinedRef = React.useMemo(
      () => (instance: HTMLInputElement | null) => {
        if (internalRef) {
          internalRef.current = instance;
        }
        if (typeof ref === "function") {
          ref(instance);
        } else if (ref) {
          ref.current = instance;
        }
      },
      [ref]
    );

    return (
      <div
        className={cn(
          "flex flex-col",
          styles.container,
          containerClassName
        )}
      >
        <div className="flex items-start gap-2">
          <div className="flex items-center pt-1">
            <label
              className="relative inline-flex cursor-pointer"
              htmlFor={props.id}
            >
              <input
                ref={combinedRef}
                type="checkbox"
                disabled={disabled}
                checked={isChecked}
                onChange={handleChange}
                className="sr-only"
                {...props}
              />
              <div
                className={cn(
                  checkboxVariants({ variant, density }),
                  error && touched && "ring-2 ring-near-black ring-offset-2",
                  successMessage && touched && "ring-2 ring-apple-blue ring-offset-2",
                  className
                )}
              >
                {(isChecked || indeterminate) && (
                  <Check
                    className={cn(
                      "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white",
                      styles.icon
                    )}
                  />
                )}
              </div>
            </label>
          </div>

          <div className="flex flex-col gap-1 flex-1">
            {label && (
              <label
                htmlFor={props.id}
                className={cn(
                  styles.label,
                  "text-near-black font-semibold cursor-pointer",
                  required && "after:content-['*'] after:ml-1 after:text-near-black",
                  disabled && "opacity-50 cursor-not-allowed",
                  labelClassName
                )}
              >
                {label}
              </label>
            )}

            {description && (
              <p className={cn("text-xs text-near-black", density === "compact" && "hidden")}>
                {description}
              </p>
            )}

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
        </div>
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
