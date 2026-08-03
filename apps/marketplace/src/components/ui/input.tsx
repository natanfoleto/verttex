import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-10 w-full min-w-0 rounded-lg border border-stone-200/80 bg-white px-3.5 py-2 text-xs shadow-2xs transition-all outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-stone-400 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-xs',
        'focus:border-emerald-600 focus-visible:border-emerald-600 focus-visible:ring-0 focus-visible:outline-none',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
