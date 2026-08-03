'use client'

import { useRouter } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'

import { useCustomer } from '../../providers/customer-auth-provider'
import { MarketplacePageLoader } from '../ui/marketplace-page-loader'

export function CustomerAuthGuard({
  children,
  fallback,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  const { customer, isLoading } = useCustomer()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isLoading && !customer) {
      router.push('/?auth=login')
    }
  }, [mounted, isLoading, customer, router])

  if (!mounted || isLoading) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <MarketplacePageLoader
        label="Autenticando..."
        minHeight="min-h-[400px]"
      />
    )
  }

  if (!customer) {
    return null
  }

  return <>{children}</>
}
