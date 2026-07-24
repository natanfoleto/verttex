import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-emerald-200 bg-emerald-50 text-emerald-800',
        secondary: 'border-amber-200 bg-amber-50 text-amber-800',
        destructive: 'border-rose-200 bg-rose-50 text-rose-800',
        outline: 'border-stone-200 text-stone-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
