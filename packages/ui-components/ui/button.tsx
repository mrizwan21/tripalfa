import * as React from "react";
import { cn } from "@tripalfa/shared-utils";
import { cva, type VariantProps } from "class-variance-authority";

/* ============================================
   BUTTON DESIGN TOKENS - STANDARDIZED SIZES
   ============================================ */
const buttonTokens = {
  // Height values
  heights: {
    sm: "2rem" /* 32px */,
    default: "2.5rem" /* 40px */,
    lg: "3rem" /* 48px */,
    icon: "2.5rem" /* 40px */,
  },
  // Padding values (horizontal)
  padding: {
    sm: "0.625rem" /* 10px */,
    default: "1rem" /* 16px */,
    lg: "1.5rem" /* 24px */,
    icon: "0" /* 0 - centered */,
  },
  // Font sizes
  fontSize: {
    sm: "0.8125rem" /* 13px */,
    default: "0.875rem" /* 14px */,
    lg: "0.9375rem" /* 15px */,
  },
  // Border radius
  borderRadius: {
    sm: "var(--radius-sm)",
    default: "var(--radius)",
    lg: "var(--radius-lg)",
  },
} as const;

const buttonVariants = cva(
  "inline-flex items-center justify-center text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] gap-2",
  {
    variants: {
      variant: {
        // Primary - Uses brand colors (customizable per tenant)
        default:
          "bg-[hsl(var(--brand-primary))] text-[hsl(var(--brand-primary-foreground))] shadow-sm hover:opacity-90 border border-transparent",

        // Secondary - Uses brand secondary colors
        secondary:
          "bg-[hsl(var(--brand-secondary))] text-[hsl(var(--brand-secondary-foreground))] shadow-sm hover:opacity-80 border border-transparent",

        // Outline - Transparent with border
        outline:
          "border border-[hsl(var(--border))] bg-transparent text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] hover:border-[hsl(var(--border))]",

        // Ghost - No background
        ghost:
          "bg-transparent text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]",

        // Link - Text only
        link: "bg-transparent text-[hsl(var(--brand-primary))] underline-offset-4 hover:underline hover:text-[hsl(var(--brand-primary))]",

        // Destructive - Error state (consistent across tenants)
        destructive:
          "bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] shadow-sm hover:opacity-90 border border-transparent",

        // Success - Consistent green
        success:
          "bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] shadow-sm hover:opacity-90 border border-transparent",

        // Warning - Consistent amber
        warning:
          "bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))] shadow-sm hover:opacity-90 border border-transparent",
      },
      size: {
        // Small button
        sm: `h-[${buttonTokens.heights.sm}] px-[${buttonTokens.padding.sm}] text-[${buttonTokens.fontSize.sm}] rounded-[${buttonTokens.borderRadius.sm}]`,
        // Default button (most common)
        default: `h-[${buttonTokens.heights.default}] px-[${buttonTokens.padding.default}] text-[${buttonTokens.fontSize.default}] rounded-[${buttonTokens.borderRadius.default}]`,
        // Large button
        lg: `h-[${buttonTokens.heights.lg}] px-[${buttonTokens.padding.lg}] text-[${buttonTokens.fontSize.lg}] rounded-[${buttonTokens.borderRadius.lg}]`,
        // Icon-only button (square)
        icon: `h-[${buttonTokens.heights.icon}] w-[${buttonTokens.heights.icon}] p-0 rounded-[${buttonTokens.borderRadius.default}]`,
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

// Apply inline styles for dynamic values
const getButtonStyles = (size: string): React.CSSProperties => {
  const styles: Record<string, React.CSSProperties> = {
    sm: {
      height: buttonTokens.heights.sm,
      paddingLeft: buttonTokens.padding.sm,
      paddingRight: buttonTokens.padding.sm,
      fontSize: buttonTokens.fontSize.sm,
      borderRadius: buttonTokens.borderRadius.sm,
    },
    default: {
      height: buttonTokens.heights.default,
      paddingLeft: buttonTokens.padding.default,
      paddingRight: buttonTokens.padding.default,
      fontSize: buttonTokens.fontSize.default,
      borderRadius: buttonTokens.borderRadius.default,
    },
    lg: {
      height: buttonTokens.heights.lg,
      paddingLeft: buttonTokens.padding.lg,
      paddingRight: buttonTokens.padding.lg,
      fontSize: buttonTokens.fontSize.lg,
      borderRadius: buttonTokens.borderRadius.lg,
    },
    icon: {
      height: buttonTokens.heights.icon,
      width: buttonTokens.heights.icon,
      padding: 0,
      borderRadius: buttonTokens.borderRadius.default,
    },
  };
  return styles[size] || styles.default;
};

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
