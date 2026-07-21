import './globals.css'

import type { Metadata } from 'next'
import * as React from 'react'

import { QueryProvider } from '../providers/query-provider'

export const metadata: Metadata = {
  title: 'Verttex Marketplace',
  description:
    'Conectamos você ao melhor dos cantos onde a internet não alcança',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
