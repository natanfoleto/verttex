import * as React from 'react'
import { RiArrowDownSLine } from 'react-icons/ri'
import { cn } from '../utils'

export interface NativeSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  wrapperClassName?: string
}

export const NativeSelect = React.forwardRef<
  HTMLSelectElement,
  NativeSelectProps
>(({ className, wrapperClassName, children, ...props }, ref) => {
  return (
    <div className={cn('relative w-full', wrapperClassName)}>
      <select
        ref={ref}
        className={cn(
          'w-full appearance-none rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 pr-10 text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <RiArrowDownSLine className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
    </div>
  )
})

NativeSelect.displayName = 'NativeSelect'
