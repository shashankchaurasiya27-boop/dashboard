import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "./utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-sm",
          {
            "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-500/20 hover:shadow-md": variant === "default",
            "bg-rose-600 text-white hover:bg-rose-700": variant === "destructive",
            "border border-slate-700 bg-transparent hover:bg-slate-800 text-slate-200": variant === "outline",
            "bg-slate-800 text-slate-100 hover:bg-slate-700": variant === "secondary",
            "hover:bg-slate-800 hover:text-slate-100": variant === "ghost",
            "text-indigo-400 underline-offset-4 hover:underline": variant === "link",
            "h-10 px-4 py-2": size === "default",
            "h-9 rounded-md px-3": size === "sm",
            "h-11 rounded-md px-8": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
