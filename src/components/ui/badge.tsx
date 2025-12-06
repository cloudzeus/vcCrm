import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Palette colors for badge dots
const badgeDotColors: Record<string, string> = {
  default: "#85A3B2", // Grauzone - blue-grey
  secondary: "#732553", // Pico Eggplant - purple
  destructive: "#FF5C8D", // Stellar Strawberry - pink
  outline: "#E9D8C8", // Siesta Tan - beige
  success: "#85A3B2", // Grauzone
  warning: "#FF5C8D", // Stellar Strawberry
  info: "#85A3B2", // Grauzone
  // Status-based colors
  PLANNED: "#85A3B2", // Grauzone
  DRAFT: "#E9D8C8", // Siesta Tan
  APPROVED: "#732553", // Pico Eggplant
  POSTED: "#85A3B2", // Grauzone
  ACTIVE: "#732553", // Pico Eggplant
  COMPLETED: "#85A3B2", // Grauzone
  CANCELLED: "#FF5C8D", // Stellar Strawberry
  // Platform-based colors
  INSTAGRAM: "#85A3B2", // Grauzone
  TIKTOK: "#732553", // Pico Eggplant
  YOUTUBE: "#85A3B2", // Grauzone
  FACEBOOK: "#142030", // Hēi Sè Black
  TWITTER: "#E9D8C8", // Siesta Tan
  LINKEDIN: "#85A3B2", // Grauzone
  OTHER: "#E9D8C8", // Siesta Tan
  // CRM Status colors
  LEAD: "#E9D8C8", // Siesta Tan - beige (new/initial)
  QUALIFIED: "#85A3B2", // Grauzone - blue-grey (qualified)
  CONTACTED: "#85A3B2", // Grauzone - blue-grey (in contact)
  NEEDS_ANALYSIS: "#732553", // Pico Eggplant - purple (analysis needed)
  OPPORTUNITY: "#732553", // Pico Eggplant - purple (opportunity)
  NEGOTIATION: "#142030", // Hēi Sè Black (negotiating)
  OFFER_SENT: "#85A3B2", // Grauzone - blue-grey (offer sent)
  OFFER_ACCEPTED: "#85A3B2", // Grauzone - blue-grey (accepted)
  WON: "#85A3B2", // Grauzone - blue-grey (won)
  LOST: "#FF5C8D", // Stellar Strawberry - pink (lost)
  CUSTOMER: "#85A3B2", // Grauzone - blue-grey (customer)
}

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border-0 px-1.5 py-0.5 text-[8px] font-light w-fit whitespace-nowrap shrink-0 [&>svg]:size-2.5 gap-1 [&>svg]:pointer-events-none transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-[#142030] text-white [a&]:hover:bg-[#142030]/90",
        secondary:
          "bg-[#142030] text-white [a&]:hover:bg-[#142030]/90",
        destructive:
          "bg-[#142030] text-white [a&]:hover:bg-[#142030]/90",
        outline:
          "bg-[#142030] text-white border-0 [a&]:hover:bg-[#142030]/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  dotColor,
  icon,
  children,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { 
    asChild?: boolean
    dotColor?: string
    icon?: React.ReactNode
  }) {
  const Comp = asChild ? Slot : "span"
  
  // Determine dot color: use dotColor prop, or variant, or try to match children text
  const getDotColor = () => {
    if (dotColor) return dotColor
    
    // Try to match children text to known types
    const childrenText = typeof children === 'string' ? children.toUpperCase() : ''
    if (badgeDotColors[childrenText]) {
      return badgeDotColors[childrenText]
    }
    
    // Fall back to variant color
    return badgeDotColors[variant || "default"] || badgeDotColors.default
  }

  const dotColorValue = getDotColor()

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    >
      {icon ? (
        <span className="shrink-0 flex items-center">
          {icon}
        </span>
      ) : (
        <span 
          className="w-1 h-1 rounded-full shrink-0"
          style={{ backgroundColor: dotColorValue }}
        />
      )}
      {children}
    </Comp>
  )
}

export { Badge, badgeVariants, badgeDotColors }
