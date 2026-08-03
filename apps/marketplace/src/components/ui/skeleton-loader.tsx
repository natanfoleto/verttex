export function ProductCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col overflow-hidden rounded-xl border border-stone-200/80 bg-white p-0 shadow-xs">
      <div className="aspect-4/3 w-full bg-stone-200" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-1/3 rounded bg-stone-200" />
        <div className="h-4 w-4/5 rounded bg-stone-200" />
        <div className="h-3 w-1/4 rounded bg-stone-200" />
        <div className="flex items-center justify-between pt-2">
          <div className="h-5 w-24 rounded bg-stone-200" />
          <div className="h-7 w-20 rounded-lg bg-stone-200" />
        </div>
      </div>
    </div>
  )
}

export function StoreCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col overflow-hidden rounded-xl border border-stone-200/80 bg-white p-0 shadow-xs">
      <div className="h-28 w-full bg-stone-200" />
      <div className="px-5 pt-0">
        <div className="-mt-8 h-16 w-16 rounded-xl border-2 border-white bg-stone-300" />
      </div>
      <div className="space-y-3 p-5 pt-2">
        <div className="h-5 w-1/2 rounded bg-stone-200" />
        <div className="h-3 w-1/3 rounded bg-stone-200" />
        <div className="h-3 w-full rounded bg-stone-200" />
        <div className="h-9 w-full rounded-lg bg-stone-200 pt-2" />
      </div>
    </div>
  )
}
