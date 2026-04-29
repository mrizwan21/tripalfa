import * as React from "react"
import { cn } from "../lib/utils"

interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-height-md w-full rounded-comfortable border border-black/10 bg-white px-4 py-2 text-[15px] font-medium ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-near-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-blue focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-all antialiased",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
