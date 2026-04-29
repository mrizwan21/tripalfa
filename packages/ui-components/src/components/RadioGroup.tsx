import * as React from "react";
import { cn } from "../lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

export type RadioGroupVariant = "b2b" | "b2c" | "admin";
export type RadioGroupDensity = "compact" | "normal" | "comfortable";
export type RadioGroupLayout = "vertical" | "horizontal";

export interface RadioOption {
  value: string | number;
  label: string;
  description?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface RadioGroupProps
  extends VariantProps<typeof radioVariants> {
  options: RadioOption[];
  value?: string | number;
  onChange?: (value: string | number) => void;
  label?: string;
  description?: string;
  error?: string;
  successMessage?: string;
  touched?: boolean;
  layout?: RadioGroupLayout;
  containerClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
  successClassName?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  name?: string;
}

const radioVariants = cva(
  "relative inline-flex shrink-0 cursor-pointer appearance-none rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        b2b: "border-near-black bg-white focus-visible:ring-apple-blue focus-visible:ring-offset-white checked:border-apple-blue checked:bg-apple-blue",
        b2c: "border-near-black bg-white focus-visible:ring-apple-blue focus-visible:ring-offset-white checked:border-apple-blue checked:bg-apple-blue",
        admin: "border-near-black bg-white focus-visible:ring-apple-blue focus-visible:ring-offset-white checked:border-near-black checked:bg-near-black",
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

const dotVariants = cva(
  "absolute rounded-full bg-current transition-transform",
  {
    variants: {
      density: {
        compact: "h-2 w-2 top-1 left-1",
        normal: "h-2.5 w-2.5 top-1 left-1",
        comfortable: "h-3 w-3 top-1.5 left-1.5",
      },
    },
    defaultVariants: {
      density: "normal",
    },
  }
);

const densityStyles = {
  compact: { label: "text-xs font-medium", container: "gap-1" },
  normal: { label: "text-sm font-medium", container: "gap-2" },
  comfortable: { label: "text-base font-medium", container: "gap-3" },
};

export const RadioGroup = React.forwardRef<
  HTMLDivElement,
  RadioGroupProps
>(
  (
    {
      options = [],
      value,
      onChange,
      label,
      description,
      error,
      successMessage,
      touched = false,
      layout = "vertical",
      variant = "b2b",
      density = "normal",
      containerClassName,
      labelClassName,
      errorClassName,
      successClassName,
      helperText,
      required = false,
      disabled = false,
      name = "radio-group",
      ...props
    },
    ref
  ) => {
    const styles = densityStyles[density || "normal"];
    const [selectedValue, setSelectedValue] = React.useState(value);

    const handleChange = (newValue: string | number) => {
      setSelectedValue(newValue);
      onChange?.(newValue);
    };

    React.useEffect(() => {
      if (value !== undefined) {
        setSelectedValue(value);
      }
    }, [value]);

    return (
      <div
        ref={ref}
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
          >
            {label}
          </label>
        )}

        {description && (
          <p className={cn("text-xs text-near-black", density === "compact" && "hidden")}>
            {description}
          </p>
        )}

        <div
          className={cn(
            "flex",
            layout === "vertical" ? "flex-col" : "flex-row flex-wrap",
            layout === "horizontal" ? "gap-4" : styles.container
          )}
        >
          {options.map((option) => {
            const isSelected = selectedValue === option.value;
            const isDisabled = disabled || option.disabled;

            return (
              <div
                key={`radio-${option.value}`}
                className="flex items-start gap-2"
              >
                <div className="flex items-center pt-1">
                  <label
                    className="relative inline-flex cursor-pointer"
                    htmlFor={`${name}-${option.value}`}
                  >
                    <input
                      id={`${name}-${option.value}`}
                      type="radio"
                      name={name}
                      value={option.value}
                      disabled={isDisabled}
                      checked={isSelected}
                      onChange={() => handleChange(option.value)}
                      className="sr-only"
                    />
                    <div
                      className={cn(
                        radioVariants({ variant, density }),
                        error && touched && "ring-2 ring-near-black ring-offset-2",
                        successMessage && touched && "ring-2 ring-apple-blue ring-offset-2"
                      )}
                    >
                      {isSelected && (
                        <span
                          className={cn(
                            dotVariants({ density }),
                            variant === "b2b" && "text-apple-blue",
                            variant === "b2c" && "text-apple-blue",
                            variant === "admin" && "text-near-black"
                          )}
                        />
                      )}
                    </div>
                  </label>
                </div>

                <div className="flex flex-col gap-1 flex-1">
                  <label
                    htmlFor={`${name}-${option.value}`}
                    className={cn(
                      styles.label,
                      "text-near-black font-semibold cursor-pointer",
                      isDisabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {option.icon && (
                        <span className="text-near-black">
                          {option.icon}
                        </span>
                      )}
                      {option.label}
                    </div>
                  </label>

                  {option.description && (
                    <p
                      className={cn(
                        "text-xs text-near-black",
                        density === "compact" && "hidden"
                      )}
                    >
                      {option.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
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

RadioGroup.displayName = "RadioGroup";
