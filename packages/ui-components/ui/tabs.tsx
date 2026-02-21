import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@tripalfa/shared-utils"

/* ============================================
   TAB DESIGN TOKENS - STANDARDIZED STYLING
   ============================================ */
const tabTokens = {
  // Tab list container
  list: {
    height: "2.5rem",        /* 40px - consistent with button height */
    padding: "var(--space-1)", /* 4px */
    gap: "var(--space-1)",    /* 4px */
    borderRadius: "var(--radius-lg)", /* 12px */
    background: "hsl(var(--muted))",
    inactiveColor: "hsl(var(--muted-foreground))",
  },
  // Tab trigger
  trigger: {
    paddingX: "var(--space-3)",   /* 12px */
    paddingY: "var(--space-2)",   /* 8px */
    fontSize: "0.875rem",         /* 14px */
    fontWeight: "500",
    borderRadius: "var(--radius-md)", /* 8px */
    transition: "all 200ms ease-in-out",
  },
  // Tab content
  content: {
    marginTop: "var(--space-4)", /* 16px */
  },
} as const;

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & { className?: string }
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center",
      // Use CSS variables for consistent sizing
      "h-10", // 40px
      "p-1",  // 4px padding
      "gap-1",
      // Background and colors
      "bg-slate-100",
      "text-slate-500",
      // Border radius matches design tokens
      "rounded-lg",
      // Flexbox for proper alignment
      "flex",
      // Transition for smooth interactions
      "transition-all duration-200",
      className
    )}
    style={{
      height: tabTokens.list.height,
      borderRadius: tabTokens.list.borderRadius,
    } as React.CSSProperties}
    {...props as any}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & { value: string; className?: string; children?: React.ReactNode }
>(({ className, value, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    value={value}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap",
      // Standardized padding using design tokens
      "px-3 py-1.5",
      // Font styling
      "text-sm font-medium",
      // Transition for smooth state changes
      "transition-all duration-200",
      // Focus states
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2",
      // Disabled state
      "disabled:pointer-events-none disabled:opacity-50",
      // Active state - uses brand colors
      "data-[state=active]:bg-white data-[state=active]:text-slate-700 data-[state=active]:shadow-sm",
      // Hover state
      "hover:text-slate-600",
      className
    )}
    style={{
      paddingLeft: tabTokens.trigger.paddingX,
      paddingRight: tabTokens.trigger.paddingX,
      paddingTop: tabTokens.trigger.paddingY,
      paddingBottom: tabTokens.trigger.paddingY,
      fontSize: tabTokens.trigger.fontSize,
      fontWeight: tabTokens.trigger.fontWeight,
      borderRadius: tabTokens.trigger.borderRadius,
    } as React.CSSProperties}
    {...props as any}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> & { value: string; className?: string; children?: React.ReactNode }
>(({ className, value, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    value={value}
    className={cn(
      // Standardized margin using design tokens
      "mt-4",
      // Focus states
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2",
      // Animation for smooth transitions
      "animate-in fade-in-0 duration-200",
      className
    )}
    style={{
      marginTop: tabTokens.content.marginTop,
    } as React.CSSProperties}
    {...props as any}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
