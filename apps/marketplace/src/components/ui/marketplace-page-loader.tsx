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

/**
  Loader de tela inteira para carregamento inicial do site ou transições de rotas.
 */
export function MarketplaceFullPageLoader({
  label = "Carregando...",
}: {
  label?: string;
}) {
  return (
    <div className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-stone-50 font-sans antialiased">
      <div className="flex flex-col items-center space-y-4">
        {/* Brand Initial Badge */}
        <div className="relative flex items-center justify-center">
          <div className="absolute h-16 w-16 rounded-lg bg-emerald-600/15 animate-ping" />
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-emerald-800 text-2xl font-black text-white shadow-md">
            V
          </div>
        </div>

        <div className="flex items-center space-x-2 pt-2">
          <RiLoader4Line className="h-5 w-5 text-emerald-800 animate-spin" />
          {label && (
            <p className="text-xs font-semibold tracking-wide text-stone-700">
              {label}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
