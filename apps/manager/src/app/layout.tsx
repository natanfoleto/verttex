import './globals.css'

import type { Metadata } from 'next'
import * as React from 'react'

import { AuthProvider } from '../providers/auth-provider'
import { QueryProvider } from '../providers/query-provider'

export const metadata: Metadata = {
  title: 'Verttex Manager',
  description: 'Painel Administrativo do Monorepo Verttex',
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
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
