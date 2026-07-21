'use client'

import { useRouter } from 'next/navigation'
import { ReactNode, useEffect } from 'react'

import { useCustomer } from '../../providers/customer-auth-provider'

export function CustomerAuthGuard({ children }: { children: ReactNode }) {
  const { customer, isLoading } = useCustomer()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !customer) {
      router.push('/login')
    }
  }, [isLoading, customer, router])

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
          <p className="text-sm font-medium text-amber-200/80">
            Carregando conta...
          </p>
        </div>
      </div>
    )
  }

  if (!customer) {
    return null
  }

  return <>{children}</>
}
