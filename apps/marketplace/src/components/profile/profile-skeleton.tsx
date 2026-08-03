'use client'

export function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8 py-12 font-sans antialiased">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-stone-200" />
        <div className="h-4 w-96 animate-pulse rounded-lg bg-stone-200" />
      </div>

      {/* Tabs Bar Skeleton */}
      <div className="border-b border-stone-200 pb-3">
        <div className="flex space-x-8">
          <div className="h-5 w-32 animate-pulse rounded-md bg-stone-200" />
          <div className="h-5 w-36 animate-pulse rounded-md bg-stone-200" />
          <div className="h-5 w-28 animate-pulse rounded-md bg-stone-200" />
        </div>
      </div>

      {/* Card Content Skeleton */}
      <div className="space-y-6 rounded-2xl border border-stone-200/80 bg-white p-8 shadow-xs">
        <div className="flex items-center space-x-3 border-b border-stone-200 pb-4">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-stone-200" />
          <div className="space-y-1.5">
            <div className="h-5 w-40 animate-pulse rounded-md bg-stone-200" />
            <div className="h-3 w-64 animate-pulse rounded-md bg-stone-200" />
          </div>
        </div>

        <div className="space-y-4 max-w-2xl">
          <div className="space-y-1.5">
            <div className="h-3 w-36 animate-pulse rounded-md bg-stone-200" />
            <div className="h-10 w-full animate-pulse rounded-lg bg-stone-100" />
          </div>

          <div className="space-y-1.5">
            <div className="h-3 w-32 animate-pulse rounded-md bg-stone-200" />
            <div className="h-10 w-full animate-pulse rounded-lg bg-stone-100" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <div className="h-3 w-24 animate-pulse rounded-md bg-stone-200" />
              <div className="h-10 w-full animate-pulse rounded-lg bg-stone-100" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-32 animate-pulse rounded-md bg-stone-200" />
              <div className="h-10 w-full animate-pulse rounded-lg bg-stone-100" />
            </div>
          </div>

          <div className="pt-2">
            <div className="h-10 w-44 animate-pulse rounded-lg bg-stone-200" />
          </div>
        </div>
      </div>
    </div>
  )
}
