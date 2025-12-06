"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full transition-all duration-200",
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  // Generate a color based on the first character using new palette
  const getColorForInitial = (initial: string) => {
    const colors = [
      { bg: "bg-[#85A3B2]", text: "text-white", hover: "hover:bg-[#7291A0]" }, // Grauzone - blue-grey
      { bg: "bg-[#732553]", text: "text-white", hover: "hover:bg-[#5F1E45]" }, // Pico Eggplant - purple
      { bg: "bg-[#142030]", text: "text-white", hover: "hover:bg-[#0F1A26]" }, // Hēi Sè Black
      { bg: "bg-[#E9D8C8]", text: "text-[#142030]", hover: "hover:bg-[#DDC8B4]" }, // Siesta Tan - beige
      { bg: "bg-[#85A3B2]", text: "text-white", hover: "hover:bg-[#7291A0]" }, // Grauzone - repeat
      { bg: "bg-[#732553]", text: "text-white", hover: "hover:bg-[#5F1E45]" }, // Pico Eggplant - repeat
      { bg: "bg-[#142030]", text: "text-white", hover: "hover:bg-[#0F1A26]" }, // Hēi Sè Black - repeat
      { bg: "bg-[#E9D8C8]", text: "text-[#142030]", hover: "hover:bg-[#DDC8B4]" }, // Siesta Tan - repeat
    ];
    const index = (initial.charCodeAt(0) || 0) % colors.length;
    return colors[index];
  };

  const initial = typeof children === 'string' ? children.charAt(0).toUpperCase() : '';
  const color = getColorForInitial(initial);

  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-full font-semibold text-white transition-all duration-200",
        color.bg,
        color.text,
        color.hover,
        className
      )}
      {...props}
    >
      {children}
    </AvatarPrimitive.Fallback>
  )
}

export { Avatar, AvatarImage, AvatarFallback }
