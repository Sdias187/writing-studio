import { forwardRef, type ButtonHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

const buttonVariants = {
  default: "bg-chrome text-ink-primary hover:bg-chrome-hover border border-border",
  ghost: "bg-transparent text-ink-secondary hover:text-ink-primary hover:bg-chrome",
  accent: "bg-accent/10 text-accent hover:bg-accent/20 border border-accent/20",
  icon: "bg-transparent text-ink-secondary hover:text-ink-primary hover:bg-chrome p-2",
} as const

type ButtonVariant = keyof typeof buttonVariants

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:opacity-40 disabled:pointer-events-none cursor-pointer",
        buttonVariants[variant],
        className
      )}
      {...props}
    />
  )
)
Button.displayName = "Button"

export const IconButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => (
    <Button ref={ref} variant="icon" className={cn("h-8 w-8", className)} {...props} />
  )
)
IconButton.displayName = "IconButton"
