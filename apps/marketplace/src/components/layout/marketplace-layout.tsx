import { ReactNode } from 'react'

import { MarketplaceFooter } from './marketplace-footer'
import { MarketplaceHeader } from './marketplace-header'

interface MarketplaceLayoutProps {
  children: ReactNode
}

export function MarketplaceLayout({ children }: MarketplaceLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-stone-950 text-stone-100 antialiased font-sans">
      <MarketplaceHeader />
      <main className="flex-1">{children}</main>
      <MarketplaceFooter />
    </div>
  )
}
