'use client'

import { useRouter } from 'next/navigation'
import { ReactNode, useEffect } from 'react'

import { useAuth } from '../../providers/auth-provider'

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [isLoading, user, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100">
        <div className="flex flex-col items-center space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 font-bold text-white shadow-lg shadow-emerald-950/30">
            V
          </div>
          <div className="flex items-center space-x-2.5">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 dark:border-zinc-700 border-t-emerald-500 shrink-0" />
            <span className="text-xs font-medium text-zinc-400">
              Carregando painel...
            </span>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
