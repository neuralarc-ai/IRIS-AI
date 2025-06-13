import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Add type for icon props
interface IconProps {
  icon?: boolean;
  [key: string]: any;
}

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 font-sans",
  {
    variants: {
      variant: {
        default: "bg-[#2B2521] text-white hover:bg-[#2B2521]/90 font-medium text-base leading-6 tracking-normal",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 font-medium text-base leading-6 tracking-normal",
        outline:
          "border border-input bg-background text-[#2B2521] hover:bg-accent hover:text-[#2B2521] font-medium text-base leading-6 tracking-normal",
        secondary:
          "bg-secondary text-white hover:bg-secondary/80 font-medium text-base leading-6 tracking-normal",
        ghost: "text-[#2B2521] hover:bg-accent hover:text-[#2B2521] font-medium text-base leading-6 tracking-normal",
        link: "text-[#2B2521] underline-offset-4 hover:underline font-medium text-base leading-6 tracking-normal",
      },
      size: {
        default: "min-w-[128px] rounded-[4px] py-4 px-[27px] gap-2",
        sm: "rounded-md px-3 py-2 font-medium text-base leading-6 tracking-normal",
        lg: "rounded-md px-8 py-2.5 font-medium text-base leading-6 tracking-normal",
        icon: "p-2 font-medium text-base leading-6 tracking-normal",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const buttonContentStyles = "font-sans font-medium text-base leading-6 tracking-normal"

const ButtonText = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(buttonContentStyles, className)}
    {...props}
  />
))
ButtonText.displayName = "ButtonText"

const ButtonIcon = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn("inline-flex items-center justify-center", className)}
    {...props}
  />
))
ButtonIcon.displayName = "ButtonIcon"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // Helper function to process children
    const processChildren = (children: React.ReactNode) => {
      if (typeof children === 'string') {
        return <ButtonText>{children}</ButtonText>
      }
      
      if (React.isValidElement(children)) {
        // If it's a single element (like an icon)
        if (children.type === 'svg' || (children.props as IconProps)?.icon) {
          return <ButtonIcon>{children}</ButtonIcon>
        }
        
        // If it's an array of elements (icon + text)
        if (Array.isArray(children)) {
          return React.Children.map(children, (child) => {
            if (typeof child === 'string') {
              return <ButtonText>{child}</ButtonText>
            }
            if (React.isValidElement(child) && (child.type === 'svg' || (child.props as IconProps)?.icon)) {
              return <ButtonIcon>{child}</ButtonIcon>
            }
            return child
          })
        }
      }
      
      return children
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {processChildren(children)}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, ButtonText, ButtonIcon, buttonVariants }
