import './globals.css'

import type { Metadata } from 'next'
import * as React from 'react'
import { Toaster } from 'sonner'

import { MarketplaceLayout } from '../components/layout/marketplace-layout'
import { CustomerAuthProvider } from '../providers/customer-auth-provider'
import { QueryProvider } from '../providers/query-provider'

export const metadata: Metadata = {
  title: 'Verttex — Mercado Regional & Produtos Artesanais',
  description:
    'Conectamos você aos melhores produtores artesanais da nossa região.',
  icons: {
    icon: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        <QueryProvider>
          <CustomerAuthProvider>
            <MarketplaceLayout>{children}</MarketplaceLayout>
          </CustomerAuthProvider>
          <Toaster position="bottom-right" theme="dark" richColors />
        </QueryProvider>
      </body>
    </html>
  )
}
