import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@tripalfa/shared-utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-slate-100 text-slate-700 hover:bg-slate-200",
        secondary:
          "border-transparent bg-slate-700 text-white hover:bg-slate-800",
        success:
          "border-transparent bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
        warning:
          "border-transparent bg-amber-50 text-amber-700 ring-1 ring-amber-200",
        destructive:
          "border-transparent bg-red-50 text-red-700 ring-1 ring-red-200",
        outline:
          "border-slate-200 text-slate-600 bg-white hover:bg-slate-50",
        ghost:
          "border-transparent text-slate-500 hover:text-slate-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> {
  children?: React.ReactNode
  className?: string
}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props as any} />
  )
}

export { Badge, badgeVariants }
