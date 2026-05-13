import React from "react";
import { cn } from "@tripalfa/ui-components";

// ------------------------------------------------------------------
// OTA Button Component
// ------------------------------------------------------------------
// Built on top of the Apple-style button system from src/index.css.
// This component provides a typed React wrapper with loading states,
// icon support, and disabled handling.
// ------------------------------------------------------------------

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button visual style */
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "destructive"
    | "pill";
  /** Button size */
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  /** Show loading spinner */
  isLoading?: boolean;
  /** Icon shown before the label */
  leftIcon?: React.ReactNode;
  /** Icon shown after the label */
  rightIcon?: React.ReactNode;
  /** Full-width block display */
  block?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  isLoading,
  leftIcon,
  rightIcon,
  block = false,
  children,
  className = "",
  disabled,
  ...props
}) => {
  const variantClasses: Record<string, string> = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    outline: "btn-outline",
    ghost: "btn-ghost",
    destructive: "btn-destructive",
    pill: "btn-pill",
  };

  const sizeClasses: Record<string, string> = {
    xs: "btn-xs",
    sm: "btn-sm",
    md: "btn-md",
    lg: "btn-lg",
    xl: "btn-xl",
    "2xl": "btn-2xl",
  };

  return (
    <button
      className={cn(
        "btn",
        variantClasses[variant],
        sizeClasses[size],
        block && "w-full",
        className
      )}
      disabled={isLoading || disabled}
      aria-disabled={isLoading || disabled}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Loading...</span>
        </span>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          <span className="truncate">{children}</span>
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
