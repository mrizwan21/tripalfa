import * as React from "react";

// ------------------------------------------------------------------
// OTA Badge Component
// ------------------------------------------------------------------
// Uses the Apple-style badge system defined in src/index.css.
// Available badge classes: badge-primary, badge-secondary,
// badge-success, badge-warning, badge-destructive
// ------------------------------------------------------------------

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Visual style variant */
  variant?:
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "destructive"
    | "neutral";
  /** Optional label text. Falls back to children */
  label?: string;
  /** Render as a dot-only indicator (no text) */
  dot?: boolean;
  /** Optional icon before the text */
  icon?: React.ReactNode;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = "neutral",
      label,
      dot = false,
      icon,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    // Map friendly variant names to CSS classes
    const variantMap: Record<string, string> = {
      primary: "badge-primary",
      secondary: "badge-secondary",
      success: "badge-success",
      warning: "badge-warning",
      destructive: "badge-destructive",
      neutral: "badge-secondary",
    };

    const content = label ?? children;

    return (
      <span
        ref={ref}
        className={`badge ${variantMap[variant]} ${className} ${
          dot ? "px-1.5" : ""
        }`.trim()}
        {...props}
      >
        {dot && (
          <span
            className="inline-block w-2 h-2 rounded-full bg-current mr-1.5"
            aria-hidden="true"
          />
        )}
        {icon && <span className="mr-1.5">{icon}</span>}
        {!dot && content}
      </span>
    );
  }
);

Badge.displayName = "Badge";

export default Badge;
