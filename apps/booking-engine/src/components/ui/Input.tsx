import * as React from "react";
import { cn } from "@tripalfa/ui-components";

export interface InputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  inputSize?: "sm" | "md" | "lg" | "xl";
  withIcon?: boolean;
  className?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, inputSize = "md", withIcon = false, ...props }, ref) => {
    const sizeClass =
      inputSize === "sm" ? "input-sm" :
      inputSize === "lg" ? "input-lg" :
      inputSize === "xl" ? "input-xl" :
      "input";

    return (
      <input
        type={type}
        className={cn(
          "input",
          sizeClass,
          withIcon && "input-with-icon",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";