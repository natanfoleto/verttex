"use client";

import { RiLoader4Line } from "react-icons/ri";

interface MarketplacePageLoaderProps {
  label?: string;
  minHeight?: string;
}

/**
  Loader centralizado elegante para substituição de esqueletos.
 */
export function MarketplacePageLoader({
  label = "Carregando...",
  minHeight = "min-h-[400px]",
}: MarketplacePageLoaderProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center space-y-3 w-full py-16 text-stone-500 font-sans antialiased ${minHeight}`}
    >
      <div className="relative flex items-center justify-center">
        {/* Pulse Ring */}
        <div className="absolute h-12 w-12 rounded-full bg-emerald-500/10 animate-ping" />
        {/* Spinner Icon */}
        <RiLoader4Line className="h-9 w-9 text-emerald-700 animate-spin" />
      </div>
      {label && (
        <p className="text-xs font-semibold tracking-wide text-stone-600 animate-pulse">
          {label}
        </p>
      )}
    </div>
  );
}
