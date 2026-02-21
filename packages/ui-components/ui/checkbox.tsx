// @ts-ignore
// @ts-ignore
import * as React from "react"
// @ts-ignore
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@tripalfa/shared-utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & { className?: string }
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded border border-slate-300 bg-white",
      "ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50 focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:bg-slate-700 data-[state=checked]:border-slate-700",
      "hover:border-slate-400 transition-colors duration-200",
      className
    )}
    {...props as any}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-white")}
      {...props as any}
    >
      <Check className="h-3 w-3" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
