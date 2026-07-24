import * as React from 'react'

import { cn } from '@/lib/utils'

interface DataTableSkeletonProps {
  columns?: number
  rows?: number
  className?: string
}

export function DataTableSkeleton({
  columns = 5,
  rows = 6,
  className,
}: DataTableSkeletonProps) {
  return (
    <div className={cn('w-full space-y-4 p-6', className)}>
      {/* Header Row Skeleton */}
      <div className="flex items-center space-x-4 border-b border-zinc-800 pb-2">
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={`header-col-${i}`}
            className="h-4 flex-1 animate-pulse rounded-md bg-zinc-800/80"
          />
        ))}
      </div>

      {/* Body Rows Skeleton */}
      <div className="space-y-3 pt-2">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="flex items-center space-x-4 border-b border-zinc-800/40 py-2"
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div
                key={`col-${colIndex}`}
                className={cn(
                  'h-5 animate-pulse rounded-md bg-zinc-800/50',
                  colIndex === 0 ? 'w-1/3 flex-none' : 'flex-1',
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
