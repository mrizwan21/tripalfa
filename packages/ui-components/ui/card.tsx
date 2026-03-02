// @ts-ignore
import * as React from "react";

import { cn } from "@tripalfa/shared-utils";

/* ============================================
   CARD DESIGN TOKENS - STANDARDIZED STYLING
   ============================================ */
const cardTokens = {
  // Card container
  container: {
    borderRadius: "var(--radius-lg)",
    border: "1px solid hsl(var(--border))",
    background: "hsl(var(--card))",
    color: "hsl(var(--card-foreground))",
    shadow: "var(--shadow-md)",
    transition: "all 200ms ease-in-out",
  },
  // Card header
  header: {
    padding: "1.5rem",
    gap: "0.375rem" /* 6px */,
  },
  // Card title
  title: {
    fontSize: "1.125rem" /* 18px */,
    fontWeight: "600",
    lineHeight: "1.5",
    letterSpacing: "-0.025em",
    color: "hsl(var(--card-foreground))",
  },
  // Card description
  description: {
    fontSize: "0.875rem" /* 14px */,
    color: "hsl(var(--muted-foreground))",
  },
  // Card content
  content: {
    padding: "1.5rem",
    paddingTop: "0",
  },
  // Card footer
  footer: {
    padding: "1.5rem",
    paddingTop: "0",
  },
} as const;

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-white text-slate-900 shadow-sm transition-all duration-200",
      className,
    )}
    style={
      {
        borderRadius: cardTokens.container.borderRadius,
        borderColor: "hsl(var(--border))",
        backgroundColor: "hsl(var(--card))",
        color: "hsl(var(--card-foreground))",
        boxShadow: cardTokens.container.shadow,
      } as React.CSSProperties
    }
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col p-6", className)}
    style={
      {
        padding: cardTokens.header.padding,
        gap: cardTokens.header.gap,
      } as React.CSSProperties
    }
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className,
    )}
    style={
      {
        fontSize: cardTokens.title.fontSize,
        fontWeight: cardTokens.title.fontWeight,
        lineHeight: cardTokens.title.lineHeight,
        letterSpacing: cardTokens.title.letterSpacing,
        color: cardTokens.title.color,
      } as React.CSSProperties
    }
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm", className)}
    style={
      {
        fontSize: cardTokens.description.fontSize,
        color: cardTokens.description.color,
      } as React.CSSProperties
    }
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-6 pt-0", className)}
    style={
      {
        padding: cardTokens.content.padding,
        paddingTop: cardTokens.content.paddingTop,
      } as React.CSSProperties
    }
    {...props}
  />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    style={
      {
        padding: cardTokens.footer.padding,
        paddingTop: cardTokens.footer.paddingTop,
      } as React.CSSProperties
    }
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
