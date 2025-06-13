import * as React from "react"

import { cn } from "@/lib/utils"

export type GradientType = "green" | "gray" | "neutral";

const gradientClasses: Record<GradientType, string> = {
  green: "bg-gradient-to-br from-[#D7E0CD] to-[#ADB7A3]",
  gray: "bg-gradient-to-br from-[#D7D4D1] to-[#BCB5AD]",
  neutral: "bg-gradient-to-br from-[#CDCDCD] to-[#969696]",
};

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  gradient?: GradientType;
  bgImage?: string;
  isInner?: boolean;
}

const Card = React.forwardRef<
  HTMLDivElement,
  CardProps
>(({ className, gradient, bgImage, isInner, ...props }, ref) => {
  const bgStyle = bgImage ? {
    backgroundImage: `url(${bgImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  } : {};

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border shadow-sm relative overflow-hidden",
        isInner ? "bg-[#FFFFFF]" : "bg-card text-card-foreground",
        gradient ? gradientClasses[gradient] : "bg-background",
        className
      )}
      style={bgStyle}
      {...props}
    />
  )
})
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6 relative z-10", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-sans font-semibold leading-none tracking-tight relative z-10",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm font-sans text-muted-foreground relative z-10", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0 relative z-10", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0 relative z-10", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
