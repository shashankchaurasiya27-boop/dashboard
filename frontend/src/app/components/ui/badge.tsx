import * as React from "react"
import { cn } from "./utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "destructive" | "outline"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-indigo-500/20 text-indigo-400": variant === "default",
          "border-transparent bg-emerald-500/20 text-emerald-400": variant === "success",
          "border-transparent bg-amber-500/20 text-amber-400": variant === "warning",
          "border-transparent bg-rose-500/20 text-rose-400": variant === "destructive",
          "text-slate-200 border-slate-700": variant === "outline",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
