import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // THEME: Standardized input for STEM Explorer
          "flex h-10 w-full rounded-[0.625rem] border-2 border-[#D6EBFF] bg-white px-3 py-2 text-base text-black ring-offset-background transition-all placeholder:text-[#888] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0078FF] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 hover:border-[#0078FF] hover:shadow-sm md:text-sm",
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
