import * as React from "react";
import { cn } from "../lib/utils";

export type FormFieldVariant = "b2b" | "b2c" | "admin";
export type FormFieldDensity = "compact" | "normal" | "comfortable";
export type FormFieldType =
  | "text"
  | "select"
  | "checkbox"
  | "radio"
  | "date"
  | "number"
  | "textarea"
  | "password"
  | "email"
  | "tel"
  | "file"
  | "range"
  | "color";

export interface FormFieldOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ValidationRule {
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
  custom?: (value: any) => boolean | string;
}

export interface FormFieldProps {
  type: FormFieldType;
  value: any;
  onChange: (value: any) => void;
  name?: string;
  id?: string;
  label?: string;
  description?: string;
  placeholder?: string;
  options?: FormFieldOption[];
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  validationRules?: ValidationRule[];
  error?: string;
  successMessage?: string;
  touched?: boolean;
  valid?: boolean;
  variant?: FormFieldVariant;
  density?: FormFieldDensity;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaLabelledBy?: string;
  ariaInvalid?: boolean | "true" | "false" | undefined;
  className?: string;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  errorClassName?: string;
  successClassName?: string;
  [key: string]: any;
}

const FormField = React.forwardRef<
  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  FormFieldProps
>(
  (
    {
      type = "text",
      value,
      onChange,
      name,
      id,
      label,
      description,
      placeholder,
      options = [],
      prefixIcon,
      suffixIcon,
      validationRules = [],
      error,
      successMessage,
      touched = false,
      valid,
      variant = "b2b",
      density = "normal",
      disabled = false,
      required = false,
      readOnly = false,
      ariaLabel,
      ariaDescribedBy,
      ariaLabelledBy,
      ariaInvalid,
      className,
      containerClassName,
      labelClassName,
      inputClassName,
      errorClassName,
      successClassName,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const fieldId = id || `${name || "field"}-${generatedId}`;
    const descriptionId = description ? `${fieldId}-description` : undefined;
    const errorId = error ? `${fieldId}-error` : undefined;

    const handleChange = (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      const target = e.target as HTMLInputElement;
      if (type === "checkbox") {
        onChange(target.checked);
      } else if (type === "number") {
        const numValue = target.value === "" ? "" : Number(target.value);
        onChange(numValue);
      } else {
        onChange(target.value);
      }
    };

    const showError = error && touched;
    const showSuccess = valid && touched && !showError;

    const getVariantStyles = () => {
      switch (variant) {
        case "b2b":
          return {
            container: "space-y-4",
            label: "block text-[10px] font-bold text-near-black/20 tracking-tight italic leading-none ml-4",
            input: "w-full h-16 px-8 bg-near-black/[0.02] border border-black/5 rounded-lg text-[13px] font-bold tracking-tight outline-none focus:bg-white focus:border-apple-blue focus:shadow-apple transition-all placeholder:text-near-black/5 shadow-inner appearance-none",
            error: "text-near-black text-xs mt-2 ml-4",
          };
        case "b2c":
          return {
            container: "space-y-3",
            label: "block text-sm font-semibold text-near-black",
            input: "w-full h-12 px-4 bg-white border border-black/10 rounded-comfortable text-[15px] font-medium outline-none focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/20 transition-all",
            error: "text-near-black text-sm mt-1",
          };
        case "admin":
          return {
            container: "space-y-2",
            label: "block text-xs font-semibold tracking-tight text-near-black",
            input: "w-full border border-near-black rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue bg-white",
            error: "text-near-black text-xs mt-1",
          };
        default:
          return {
            container: "space-y-2",
            label: "block text-sm font-medium text-near-black",
            input: "w-full border border-near-black rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue",
            error: "text-near-black text-xs mt-1",
          };
      }
    };

    const getDensityStyles = () => {
      switch (density) {
        case "compact":
          return { container: "space-y-1", input: "py-1 text-xs" };
        case "comfortable":
          return { container: "space-y-3", input: "py-3 text-base" };
        default:
          return { container: "space-y-2", input: "py-2 text-sm" };
      }
    };

    const variantStyles = getVariantStyles();
    const densityStyles = getDensityStyles();

    const renderInput = () => {
      const baseInputClasses = cn(
        variantStyles.input,
        densityStyles.input,
        showError && "border-near-black focus:border-near-black focus:ring-near-black/20",
        showSuccess && "border-apple-blue focus:border-apple-blue focus:ring-apple-blue/20",
        disabled && "opacity-50 cursor-not-allowed",
        readOnly && "bg-near-black cursor-default",
        inputClassName,
        (prefixIcon || suffixIcon) && "pl-10"
      );

      const commonProps = {
        id: fieldId,
        name,
        value: value ?? "",
        onChange: handleChange,
        disabled,
        readOnly,
        required,
        "aria-label": ariaLabel || label,
        "aria-labelledby": ariaLabelledBy,
        "aria-describedby": cn(descriptionId, errorId),
        "aria-invalid": ariaInvalid ?? (showError ? ("true" as const) : ("false" as const)),
        className: baseInputClasses,
        placeholder,
        ...props,
      };

      switch (type) {
        case "select":
          return (
            <select ref={ref as React.Ref<HTMLSelectElement>} {...commonProps}>
              {placeholder && <option value="">{placeholder}</option>}
              {options.map((option: FormFieldOption) => (
                <option
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </option>
              ))}
            </select>
          );
        case "textarea":
          return (
            <textarea
              ref={ref as React.Ref<HTMLTextAreaElement>}
              rows={
                density === "compact" ? 2 : density === "comfortable" ? 4 : 3
              }
              {...commonProps}
            />
          );
        case "checkbox":
          return (
            <div className="flex items-center">
              <input
                ref={ref as React.Ref<HTMLInputElement>}
                type="checkbox"
                checked={!!value}
                onChange={handleChange}
                disabled={disabled}
                readOnly={readOnly}
                required={required}
                aria-label={ariaLabel || label}
                aria-describedby={cn(descriptionId, errorId)}
                aria-invalid={
                  ariaInvalid ?? (showError ? ("true" as const) : ("false" as const))
                }
                className={cn(
                  "h-4 w-4 rounded border-near-black text-apple-blue focus:ring-apple-blue",
                  disabled && "opacity-50 cursor-not-allowed",
                  readOnly && "bg-near-black cursor-default",
                  inputClassName
                )}
                {...props}
              />
              {label && (
                <label
                  htmlFor={fieldId}
                  className={cn(
                    "ml-2 block text-sm font-medium text-near-black",
                    disabled && "opacity-50",
                    labelClassName
                  )}
                >
                  {label}
                  {required && <span className="text-near-black ml-1">*</span>}
                </label>
              )}
            </div>
          );
        case "file":
          return (
            <div className="relative">
              <input
                ref={ref as React.Ref<HTMLInputElement>}
                type="file"
                {...commonProps}
                className={cn(
                  baseInputClasses,
                  "py-2 px-3",
                  "file:mr-4 file:py-2 file:px-4",
                  "file:rounded-full file:border-0",
                  "file:text-sm file:font-semibold",
                  variant === "b2b" && "file:bg-near-black/5 file:text-near-black/50",
                  variant === "b2c" && "file:bg-apple-blue file:text-apple-blue",
                  variant === "admin" && "file:bg-near-black file:text-near-black",
                  "file:cursor-pointer"
                )}
              />
            </div>
          );
        case "range":
          return (
            <div className="flex items-center space-x-3">
              <input
                ref={ref as React.Ref<HTMLInputElement>}
                type="range"
                {...commonProps}
                className={cn(baseInputClasses, "py-0")}
              />
              <span className="text-sm font-medium text-near-black min-w-[40px] text-right">
                {value}
              </span>
            </div>
          );
        case "color":
          return (
            <div className="flex items-center space-x-3">
              <input
                ref={ref as React.Ref<HTMLInputElement>}
                type="color"
                {...commonProps}
                className={cn(baseInputClasses, "h-10 w-10 p-1")}
              />
              <span className="text-sm font-medium text-near-black">
                {value}
              </span>
            </div>
          );
        case "radio":
          return (
            <div className="space-y-2">
              {options.map((option: FormFieldOption) => (
                <div key={option.value} className="flex items-center">
                  <input
                    type="radio"
                    id={`${fieldId}-${option.value}`}
                    name={name || fieldId}
                    value={option.value}
                    checked={value === option.value}
                    onChange={handleChange}
                    disabled={disabled || option.disabled}
                    required={required}
                    className={cn(
                      "h-4 w-4 border-near-black text-apple-blue focus:ring-apple-blue",
                      (disabled || option.disabled) &&
                        "opacity-50 cursor-not-allowed",
                      inputClassName
                    )}
                  />
                  <label
                    htmlFor={`${fieldId}-${option.value}`}
                    className={cn(
                      "ml-2 block text-sm font-medium",
                      disabled || option.disabled
                        ? "text-near-black"
                        : "text-near-black",
                      labelClassName
                    )}
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          );
        default:
          return (
            <div className="relative">
              {prefixIcon && (
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  {prefixIcon}
                </div>
              )}
              <input
                ref={ref as React.Ref<HTMLInputElement>}
                type={type}
                {...commonProps}
              />
              {suffixIcon && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {suffixIcon}
                </div>
              )}
              {showSuccess && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-apple-blue">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
              {showError && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-near-black">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
          );
      }
    };

    if (type === "checkbox" || type === "radio") {
      return (
        <div
          className={cn(
            variantStyles.container,
            densityStyles.container,
            containerClassName,
            className
          )}
        >
          {renderInput()}
          {description && (
            <p id={descriptionId} className="text-sm text-near-black mt-1">
              {description}
            </p>
          )}
          {showError && (
            <div
              id={errorId}
              className={cn(
                "flex items-start mt-1 text-near-black",
                errorClassName
              )}
              role="alert"
              aria-live="assertive"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mt-0.5 mr-1 flex-shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}
          {showSuccess && successMessage && (
            <div
              className={cn(
                "flex items-start mt-1 text-apple-blue",
                successClassName
              )}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mt-0.5 mr-1 flex-shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{successMessage}</span>
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        className={cn(
          variantStyles.container,
          densityStyles.container,
          containerClassName,
          className
        )}
      >
        {label && (
          <label htmlFor={fieldId} className={cn(variantStyles.label, labelClassName)}>
            {label}
            {required && <span className="text-near-black ml-1">*</span>}
          </label>
        )}
        {renderInput()}
        {description && (
          <p id={descriptionId} className="text-sm text-near-black mt-1">
            {description}
          </p>
        )}
        {showError && (
          <div
            id={errorId}
            className={cn(
              "flex items-start mt-1 text-near-black",
              errorClassName
            )}
            role="alert"
            aria-live="assertive"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mt-0.5 mr-1 flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}
        {showSuccess && successMessage && (
          <div
            className={cn(
              "flex items-start mt-1 text-apple-blue",
              successClassName
            )}
            aria-live="polite"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mt-0.5 mr-1 flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";
export { FormField };