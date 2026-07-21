'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usePathname, useRouter } from 'next/navigation'
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
} from 'react'

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
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(
  undefined
)

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()

  const isPublicAuthRoute =
    pathname === '/login' ||
    pathname === '/cadastro' ||
    pathname === '/esqueci-minha-senha' ||
    pathname === '/redefinir-senha'

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
  })

  const logoutMutation = useMutation({
    mutationFn: () => apiClient('/auth/customers/logout', { method: 'POST' }),
    onSuccess: () => {
      queryClient.setQueryData(['auth-customer-me'], null)
      queryClient.clear()
      router.push('/login')
    },
  })

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync()
  }, [logoutMutation])

  const value = useMemo(
    () => ({
      customer: customer || null,
      isLoading,
      isError,
      refetchCustomer: refetch,
      logout,
    }),
    [customer, isLoading, isError, refetch, logout]
  )

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
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
