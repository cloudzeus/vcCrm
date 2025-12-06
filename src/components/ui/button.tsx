import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-[#142030] text-white hover:bg-[#142030]/90 shadow-sm",
        destructive:
          "bg-[#142030] text-white hover:bg-[#142030]/90 focus-visible:ring-[#142030]/20",
        outline:
          "border border-dotted border-gray-200 bg-white text-[#142030] shadow-xs hover:bg-gray-50",
        secondary:
          "bg-[#142030] text-white hover:bg-[#142030]/90",
        ghost:
          "hover:bg-gray-100 text-[#142030]",
        link: "text-[#142030] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-7 px-3 py-1.5 text-xs has-[>svg]:px-2",
        sm: "h-6 rounded-md gap-1 px-2 text-xs has-[>svg]:px-1.5",
        lg: "h-8 rounded-md px-4 text-xs has-[>svg]:px-3",
        icon: "size-7",
        "icon-sm": "size-6",
        "icon-lg": "size-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
