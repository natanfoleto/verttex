'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  createContext,
  ReactNode,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { AuthDialog } from '../components/auth/auth-dialog'
import { apiClient, ApiError } from '../lib/api-client'

export interface CustomerProfile {
  id: string
  name: string
  email: string
  phone?: string
}

interface CustomerAuthContextType {
  customer: CustomerProfile | null
  isLoading: boolean
  isError: boolean
  refetchCustomer: () => void
  logout: () => Promise<void>
  openAuthModal: (mode?: 'login' | 'register') => void
  closeAuthModal: () => void
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(
  undefined
)

function AuthQueryHandler({
  openAuthModal,
}: {
  openAuthModal: (mode: 'login' | 'register') => void
}) {
  const searchParams = useSearchParams()

  useEffect(() => {
    const authParam = searchParams.get('auth')
    if (authParam === 'login' || authParam === 'register') {
      openAuthModal(authParam)
    }
  }, [searchParams, openAuthModal])

  return null
}

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()

  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')

  const openAuthModal = useCallback((mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode)
    setIsAuthOpen(true)
  }, [])

  const closeAuthModal = useCallback(() => {
    setIsAuthOpen(false)
  }, [])

  const isPublicAuthRoute =
    pathname === '/esqueci-minha-senha' || pathname === '/redefinir-senha'

  const {
    data: customer,
    isLoading,
    isError,
    refetch,
  } = useQuery<CustomerProfile | null>({
    queryKey: ['auth-customer-me'],
    queryFn: async () => {
      try {
        const data = await apiClient<CustomerProfile>('/auth/customers/me')
        return data
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 401) {
          return null
        }
        throw err
      }
    },
    enabled: !isPublicAuthRoute,
    retry: false,
    refetchOnWindowFocus: false,
  })

  const logout = useCallback(async () => {
    queryClient.setQueryData(['auth-customer-me'], null)
    queryClient.cancelQueries()
    router.replace('/')

    try {
      await apiClient('/auth/customers/logout', { method: 'POST' })
    } catch {
      // Ignore errors during logout
    } finally {
      queryClient.clear()
    }
  }, [queryClient, router])

  const value = useMemo(
    () => ({
      customer: customer || null,
      isLoading,
      isError,
      refetchCustomer: refetch,
      logout,
      openAuthModal,
      closeAuthModal,
    }),
    [customer, isLoading, isError, refetch, logout, openAuthModal, closeAuthModal]
  )

  return (
    <CustomerAuthContext.Provider value={value}>
      <Suspense fallback={null}>
        <AuthQueryHandler openAuthModal={openAuthModal} />
      </Suspense>
      {children}
      <AuthDialog
        open={isAuthOpen}
        onOpenChange={setIsAuthOpen}
        initialMode={authMode}
      />
    </CustomerAuthContext.Provider>
  )
}

export function useCustomer() {
  const context = useContext(CustomerAuthContext)
  if (!context) {
    throw new Error(
      'useCustomer deve ser usado dentro de um CustomerAuthProvider'
    )
  }
  return context
}
