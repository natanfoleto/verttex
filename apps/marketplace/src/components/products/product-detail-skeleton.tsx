'use client'

export function ProductDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 font-sans antialiased sm:px-6 lg:px-8">
      {/* Breadcrumb Skeleton */}
      <div className="h-4 w-64 animate-pulse rounded-md bg-stone-200" />

      {/* Main 3-Column Layout Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left + Center Area: Photos & Product Info (span 8) */}
        <div className="space-y-8 lg:col-span-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
            {/* Photos & Thumbnails Below (md:col-span-6) */}
            <div className="space-y-4 md:col-span-6">
              <div className="aspect-square w-full animate-pulse rounded-2xl bg-stone-200" />
              <div className="flex space-x-3 overflow-hidden">
                <div className="h-16 w-16 animate-pulse rounded-xl bg-stone-200" />
                <div className="h-16 w-16 animate-pulse rounded-xl bg-stone-200" />
                <div className="h-16 w-16 animate-pulse rounded-xl bg-stone-200" />
                <div className="h-16 w-16 animate-pulse rounded-xl bg-stone-200" />
              </div>
            </div>

            {/* Central Product Info Column (md:col-span-6) */}
            <div className="space-y-6 md:col-span-6">
              <div className="space-y-2">
                <div className="h-3 w-28 animate-pulse rounded-md bg-stone-200" />
                <div className="h-8 w-full animate-pulse rounded-lg bg-stone-200" />
                <div className="h-4 w-3/4 animate-pulse rounded-md bg-stone-200" />
                <div className="h-4 w-32 animate-pulse rounded-md bg-stone-200" />
              </div>

              {/* Price Skeleton */}
              <div className="space-y-2 border-t border-b border-stone-100 py-4">
                <div className="h-4 w-20 animate-pulse rounded-md bg-stone-200" />
                <div className="h-9 w-40 animate-pulse rounded-lg bg-stone-200" />
                <div className="h-4 w-48 animate-pulse rounded-md bg-stone-200" />
              </div>

              {/* Variation Selectors Skeleton */}
              <div className="space-y-3">
                <div className="h-3 w-32 animate-pulse rounded-md bg-stone-200" />
                <div className="flex space-x-2">
                  <div className="h-10 w-24 animate-pulse rounded-xl bg-stone-200" />
                  <div className="h-10 w-24 animate-pulse rounded-xl bg-stone-200" />
                </div>
              </div>

              {/* Specs List Skeleton */}
              <div className="space-y-2 pt-2">
                <div className="h-4 w-48 animate-pulse rounded-md bg-stone-200" />
                <div className="h-3 w-full animate-pulse rounded-md bg-stone-200" />
                <div className="h-3 w-5/6 animate-pulse rounded-md bg-stone-200" />
                <div className="h-3 w-4/6 animate-pulse rounded-md bg-stone-200" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Area: Shipping, Buying Actions & Seller Card (span 4) */}
        <div className="space-y-6 lg:col-span-4">
          {/* Buying Box Skeleton */}
          <div className="space-y-4 rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs">
            <div className="h-5 w-40 animate-pulse rounded-md bg-stone-200" />
            <div className="h-4 w-full animate-pulse rounded-md bg-stone-200" />
            <div className="h-4 w-3/4 animate-pulse rounded-md bg-stone-200" />

            <div className="h-12 w-full animate-pulse rounded-xl bg-stone-200" />
            <div className="h-12 w-full animate-pulse rounded-xl bg-stone-200" />

            <div className="space-y-2 border-t border-stone-100 pt-4">
              <div className="h-3 w-full animate-pulse rounded-md bg-stone-200" />
              <div className="h-3 w-full animate-pulse rounded-md bg-stone-200" />
            </div>
          </div>

          {/* Seller / Store Info Card Skeleton */}
          <div className="space-y-4 rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 animate-pulse rounded-xl bg-stone-200" />
              <div className="space-y-1">
                <div className="h-4 w-36 animate-pulse rounded-md bg-stone-200" />
                <div className="h-3 w-24 animate-pulse rounded-md bg-stone-200" />
              </div>
            </div>
            <div className="h-12 w-full animate-pulse rounded-xl bg-stone-200" />
          </div>
        </div>
      </div>
    </div>
  )
}
