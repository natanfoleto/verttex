'use client'

import * as React from 'react'
import { RiRefreshLine } from 'react-icons/ri'

import { Button } from '@/components/ui/button'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 px-4 py-16 text-center font-sans text-stone-900">
      <div className="max-w-md space-y-4 rounded-3xl border border-stone-200/80 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-bold text-stone-900">
          Ops! Ocorreu um problema inesperado.
        </h2>
        <p className="text-xs text-stone-500">
          Não foi possível carregar as informações desta página no momento.
        </p>

        <Button type="button" onClick={() => reset()}>
          <RiRefreshLine className="h-4 w-4" />
          <span>Tentar novamente</span>
        </Button>
      </div>
    </div>
  )
}
