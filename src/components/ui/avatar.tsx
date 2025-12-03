"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import Image from 'next/image';

import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof Image>,
  Omit<React.ComponentPropsWithoutRef<typeof Image>, 'alt'> & { alt: string }
>(({ className, alt, ...props }, ref) => (
  <AvatarPrimitive.Image asChild>
    <Image
      ref={ref}
      alt={alt}
      className={cn("aspect-square h-full w-full", className)}
      {...props}
      // Since we don't know the image dimensions, we can use fill and let the parent control it.
      // Or specify a default size if that's more appropriate.
      // For Avatars, h-10 w-10 is set on the root, so width/height is better.
      width={40}
      height={40}
    />
  </AvatarPrimitive.Image>
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
