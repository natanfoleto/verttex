import { ReactNode } from 'react'

import { MarketplaceFooter } from './marketplace-footer'
import { MarketplaceHeader } from './marketplace-header'

interface MarketplaceLayoutProps {
  children: ReactNode
}

export function MarketplaceLayout({ children }: MarketplaceLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50 font-sans text-stone-900 antialiased selection:bg-emerald-100 selection:text-emerald-900">
      <MarketplaceHeader />
      <main className="w-full flex-1">{children}</main>
      <MarketplaceFooter />
    </div>
  )
}
