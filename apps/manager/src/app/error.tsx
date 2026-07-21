'use client'

import * as React from 'react'

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
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-bold">Algo deu errado!</h2>
      <button
        onClick={() => reset()}
        className="bg-primary text-primary-foreground cursor-pointer rounded-md px-4 py-2 text-sm font-medium"
      >
        Tentar novamente
      </button>
    </div>
  )
}
