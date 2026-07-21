import * as React from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={twMerge(
          clsx(
            'focus-visible:ring-ring inline-flex h-10 cursor-pointer items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
            {
              'bg-primary text-primary-foreground hover:bg-primary/90':
                variant === 'default',
              'border-input bg-background hover:bg-accent hover:text-accent-foreground border':
                variant === 'outline',
              'hover:bg-accent hover:text-accent-foreground':
                variant === 'ghost',
            },
            className
          )
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
