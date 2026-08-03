'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutos sem refetch desnecessário ao navegar
            gcTime: 30 * 60 * 1000, // 30 minutos mantido na memória da aplicação
            refetchOnWindowFocus: false, // Evita recarregar/piscar dados ao mudar de aba
            refetchOnMount: false, // Reutiliza dados em cache ao remontar telas
            retry: 1,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
