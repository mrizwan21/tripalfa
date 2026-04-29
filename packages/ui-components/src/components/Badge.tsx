import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-pill border px-2.5 py-0.5 text-[11px] font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-apple-blue focus:ring-offset-2  tracking-tightst",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-apple-blue/10 text-apple-blue",
        secondary:
          "border-transparent bg-black/5 text-near-black/60",
        destructive:
          "border-transparent bg-near-black/5 text-near-black",
        success:
          "border-transparent bg-apple-blue/10 text-apple-blue",
        outline: "text-near-black border-black/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
