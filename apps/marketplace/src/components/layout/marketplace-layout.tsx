'use client'

import { useQuery } from '@tanstack/react-query'
import { ReactNode, useEffect, useState } from 'react'

import { apiClient } from '../../lib/api-client'
import { MarketplaceFooter } from './marketplace-footer'
import { MarketplaceHeader } from './marketplace-header'

type UnknownCategory = Record<string, unknown>

interface MarketplaceLayoutProps {
  children: ReactNode
}

export function MarketplaceLayout({ children }: MarketplaceLayoutProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Pre-load marketplace settings globally for header & branding
  useQuery<Record<string, unknown>>({
    queryKey: ['public-marketplace-settings'],
    queryFn: async () => {
      const res = await apiClient<
        Record<string, unknown> | { data: Record<string, unknown> }
      >('/public/marketplace/settings')
      return 'data' in res ? (res.data as Record<string, unknown>) : res
    },
  })

  // Pre-load public categories globally for header mega-dropdown
  useQuery<UnknownCategory[]>({
    queryKey: ['public-categories'],
    queryFn: async () => {
      const res = await apiClient<UnknownCategory[]>(
        '/public/catalog/categories',
      )
      return Array.isArray(res) ? res : []
    },
  })

  if (!mounted) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-stone-900 antialiased selection:bg-emerald-100 selection:text-emerald-900">
      <MarketplaceHeader />
      <main className="w-full flex-1">{children}</main>
      <MarketplaceFooter />
    </div>
  )
}
