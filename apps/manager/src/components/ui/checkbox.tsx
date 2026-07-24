import * as React from 'react'
import { RiCheckLine } from 'react-icons/ri'

import { cn } from '@/lib/utils'

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode
  description?: React.ReactNode
  wrapperClassName?: string
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    { className, wrapperClassName, label, description, disabled, id, ...props },
    ref,
  ) => {
    const generatedId = React.useId()
    const checkboxId = id || generatedId

    return (
      <label
        htmlFor={checkboxId}
        className={cn(
          'group inline-flex items-start space-x-3 select-none',
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          wrapperClassName,
        )}
      >
        <div className="relative flex items-center justify-center pt-0.5">
          <input
            type="checkbox"
            id={checkboxId}
            ref={ref}
            disabled={disabled}
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              'flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-all duration-150 ease-in-out',
              'border-zinc-800 bg-zinc-950/80 peer-focus-visible:border-emerald-500 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500/30 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-zinc-950',
              'group-hover:border-zinc-700 group-hover:bg-zinc-900',
              'peer-checked:border-emerald-500 peer-checked:bg-emerald-600 peer-checked:text-white peer-checked:shadow-sm peer-checked:shadow-emerald-950/60',
              'peer-checked:group-hover:border-emerald-400 peer-checked:group-hover:bg-emerald-500',
              className,
            )}
          >
            <RiCheckLine className="h-3.5 w-3.5 stroke-1 transition-transform duration-150 ease-in-out peer-checked:scale-100 scale-0 opacity-0 peer-checked:opacity-100" />
          </div>
        </div>

        {(label || description) && (
          <div className="flex flex-col text-sm leading-tight">
            {label && (
              <span className="font-medium text-zinc-200 group-hover:text-zinc-100 transition-colors">
                {label}
              </span>
            )}
            {description && (
              <span className="text-xs text-zinc-400 mt-0.5">
                {description}
              </span>
            )}
          </div>
        )}
      </label>
    )
  },
)
Checkbox.displayName = 'Checkbox'

export { Checkbox }
