import React from "react";
import { cn } from "@tripalfa/ui-components";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  isLoading?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  isLoading,
  children,
  className = "",
  disabled,
  ...props
}) => {
  const variantClasses = {
    primary: "btn-primary", // TripAlfa Coral (#f45d48) - Main buttons
    secondary: "btn-secondary", // TripAlfa Navy (#10216b) - Alternative
    outline: "btn-outline",
    ghost: "btn-ghost",
    destructive: "btn-destructive",
  };

  const sizeClasses = {
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
        className,
      )}
      disabled={isLoading || disabled}
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
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span>Loading</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};