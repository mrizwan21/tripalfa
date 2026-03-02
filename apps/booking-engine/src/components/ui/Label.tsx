import * as React from "react";
import { cn } from "@tripalfa/ui-components";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("label", required && "label-required", className)}
      {...props}
    />
  ),
);
Label.displayName = "Label";
