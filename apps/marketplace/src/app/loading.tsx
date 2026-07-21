import * as React from 'react'

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8 font-sans text-stone-500">
      <div className="flex flex-col items-center space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-stone-300 border-t-emerald-800" />
        <span className="text-xs font-semibold text-stone-600">
          Carregando Verttex...
        </span>
      </div>
    </div>
  )
}
