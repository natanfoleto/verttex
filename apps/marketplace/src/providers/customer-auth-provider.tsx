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
  cpfCnpj?: string
  birthDate?: string
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

const HAS_SESSION_KEY = 'verttex_customer_has_session'

function getHasSessionIndicator(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(HAS_SESSION_KEY) === 'true'
}

function setHasSessionIndicator(hasSession: boolean) {
  if (typeof window === 'undefined') return
  if (hasSession) {
    localStorage.setItem(HAS_SESSION_KEY, 'true')
  } else {
    localStorage.removeItem(HAS_SESSION_KEY)
  }
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(
  undefined,
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

  const [hasSession, setHasSessionState] = useState<boolean>(() => {
    return getHasSessionIndicator()
  })

  const updateHasSession = useCallback((value: boolean) => {
    setHasSessionIndicator(value)
    setHasSessionState(value)
  }, [])

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
        updateHasSession(true)
        return data
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 401) {
          updateHasSession(false)
          return null
        }
        throw err
      }
    },
    enabled: !isPublicAuthRoute && hasSession,
    retry: false,
    refetchOnWindowFocus: false,
  })

  const refetchCustomer = useCallback(() => {
    updateHasSession(true)
    refetch()
  }, [updateHasSession, refetch])

  const logout = useCallback(async () => {
    updateHasSession(false)
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
  }, [updateHasSession, queryClient, router])

  const value = useMemo(
    () => ({
      customer: customer || null,
      isLoading,
      isError,
      refetchCustomer,
      logout,
      openAuthModal,
      closeAuthModal,
    }),
    [
      customer,
      isLoading,
      isError,
      refetchCustomer,
      logout,
      openAuthModal,
      closeAuthModal,
    ],
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
      'useCustomer deve ser usado dentro de um CustomerAuthProvider',
    )
  }
  return context
}
