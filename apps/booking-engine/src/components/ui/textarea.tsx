import * as React from "react";
import { cn } from "@tripalfa/ui-components";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "min-h-[96px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm",
          "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40",
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
