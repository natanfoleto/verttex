'use client'

export function CartSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8 py-12 font-sans antialiased">
      {/* Title Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-stone-200" />
        <div className="h-4 w-96 animate-pulse rounded-lg bg-stone-200" />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Cart Items Skeleton */}
        <div className="space-y-6 lg:col-span-8">
          <div className="space-y-4 rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs">
            <div className="flex items-center space-x-3 border-b border-stone-200 pb-4">
              <div className="h-6 w-6 animate-pulse rounded-full bg-stone-200" />
              <div className="h-5 w-48 animate-pulse rounded-md bg-stone-200" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-4 border-b border-stone-100 pb-4">
                <div className="h-20 w-20 animate-pulse rounded-xl bg-stone-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 animate-pulse rounded-md bg-stone-200" />
                  <div className="h-3 w-1/2 animate-pulse rounded-md bg-stone-200" />
                  <div className="h-4 w-24 animate-pulse rounded-md bg-stone-200" />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="h-20 w-20 animate-pulse rounded-xl bg-stone-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 animate-pulse rounded-md bg-stone-200" />
                  <div className="h-3 w-1/3 animate-pulse rounded-md bg-stone-200" />
                  <div className="h-4 w-24 animate-pulse rounded-md bg-stone-200" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary Skeleton */}
        <div className="space-y-6 lg:col-span-4">
          <div className="space-y-4 rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs">
            <div className="h-6 w-40 animate-pulse rounded-md bg-stone-200" />
            <div className="space-y-3 border-t border-b border-stone-200 py-4">
              <div className="flex justify-between">
                <div className="h-4 w-24 animate-pulse rounded-md bg-stone-200" />
                <div className="h-4 w-20 animate-pulse rounded-md bg-stone-200" />
              </div>
              <div className="flex justify-between">
                <div className="h-4 w-28 animate-pulse rounded-md bg-stone-200" />
                <div className="h-4 w-16 animate-pulse rounded-md bg-stone-200" />
              </div>
            </div>
            <div className="flex justify-between pt-2">
              <div className="h-6 w-20 animate-pulse rounded-md bg-stone-200" />
              <div className="h-6 w-28 animate-pulse rounded-md bg-stone-200" />
            </div>
            <div className="h-12 w-full animate-pulse rounded-xl bg-stone-200" />
          </div>
        </div>
      </div>
    </div>
  )
}
