import Link from 'next/link'
import { IconType } from 'react-icons'
import { RiSearchLine } from 'react-icons/ri'

import { Button } from '@/components/ui/button'

export interface EmptyStateProps {
  icon?: IconType
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  onActionClick?: () => void
}

export function EmptyState({
  icon: Icon = RiSearchLine,
  title,
  description,
  actionLabel,
  actionHref,
  onActionClick,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-stone-200/80 bg-white p-12 text-center shadow-xs">
      <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-amber-200/60 bg-amber-50 text-amber-800 shadow-xs">
        <Icon className="h-8 w-8 text-amber-700" />
      </div>

      <h3 className="mt-4 text-lg font-bold text-stone-900">{title}</h3>
      <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-stone-500">
        {description}
      </p>

      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-6 inline-flex items-center space-x-2 rounded-lg bg-emerald-800 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-emerald-700"
        >
          <span>{actionLabel}</span>
        </Link>
      )}

      {actionLabel && !actionHref && onActionClick && (
        <Button type="button" onClick={onActionClick} className="mt-6">
          <span>{actionLabel}</span>
        </Button>
      )}
    </div>
  )
}
