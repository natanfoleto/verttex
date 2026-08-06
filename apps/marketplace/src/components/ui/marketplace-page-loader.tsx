'use client'

import { RiLoader4Line } from 'react-icons/ri'

interface MarketplacePageLoaderProps {
  label?: string
  minHeight?: string
}

/**
  Loader centralizado elegante para substituição de esqueletos.
 */
export function MarketplacePageLoader({
  label = 'Carregando...',
  minHeight = 'min-h-[400px]',
}: MarketplacePageLoaderProps) {
  return (
    <div
      className={`flex w-full flex-col items-center justify-center space-y-3 py-16 font-sans text-stone-500 antialiased ${minHeight}`}
    >
      <div className="relative flex items-center justify-center">
        {/* Pulse Ring */}
        <div className="absolute h-12 w-12 animate-ping rounded-full bg-emerald-500/10" />
        {/* Spinner Icon */}
        <RiLoader4Line className="h-9 w-9 animate-spin text-emerald-700" />
      </div>
      {label && (
        <p className="animate-pulse text-xs font-semibold tracking-wide text-stone-600">
          {label}
        </p>
      )}
    </div>
  )
}
