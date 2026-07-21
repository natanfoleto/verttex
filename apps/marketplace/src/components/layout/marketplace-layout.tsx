import { ReactNode } from 'react'

import { MarketplaceFooter } from './marketplace-footer'
import { MarketplaceHeader } from './marketplace-header'

interface MarketplaceLayoutProps {
  children: ReactNode
}

export function MarketplaceLayout({ children }: MarketplaceLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-stone-950 font-sans text-stone-100 antialiased">
      <MarketplaceHeader />
      <main className="flex-1">{children}</main>
      <MarketplaceFooter />
    </div>
  )
}
