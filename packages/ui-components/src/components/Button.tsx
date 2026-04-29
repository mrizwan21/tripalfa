import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../lib/utils"
import { Loader2 } from "lucide-react"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-[17px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apple-blue disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] antialiased",
  {
    variants: {
      variant: {
        default: "bg-apple-blue text-white hover:bg-apple-blue/90 shadow-sm rounded-lg",
        primary: "bg-apple-blue text-white hover:bg-apple-blue/90 shadow-sm rounded-lg",
        secondary: "bg-near-black text-white hover:bg-near-black/90 shadow-sm rounded-lg",
        pill: "bg-transparent border border-apple-blue text-apple-blue hover:bg-apple-blue/5 rounded-pill",
        outline: "bg-transparent border border-black/10 text-near-black hover:bg-black/5 rounded-lg",
        ghost: "bg-transparent text-near-black hover:bg-black/5 rounded-lg",
        link: "text-apple-blue underline-offset-4 hover:underline",
        destructive: "bg-red-500 text-white hover:bg-red-600 shadow-sm rounded-lg",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 px-3",
        md: "h-10 px-6",
        lg: "h-12 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading = false, disabled = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }), isLoading && "relative")}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
