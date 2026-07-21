'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AppAbility, defineAbilityFor, UserToken } from '@verttex/auth'
import { usePathname, useRouter } from 'next/navigation'
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
} from 'react'

import { apiClient, ApiError } from '../lib/api-client'

export interface UserPermissionItem {
  key?: string
  effect?: 'allow' | 'deny'
  origin?: 'role' | 'override'
  permission?: { key: string }
}

export interface UserProfile {
  id: string
  name: string
  email: string
  phone?: string
  role: {
    id: string
    key: string
    name: string
  }
  rolePermissions?: { permission: { key: string } }[]
  permissions?: UserPermissionItem[]
}

interface AuthContextType {
  user: UserProfile | null
  ability: AppAbility
  isLoading: boolean
  isError: boolean
  refetchUser: () => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()

  const isPublicAuthRoute =
    pathname === '/login' ||
    pathname === '/esqueci-minha-senha' ||
    pathname === '/redefinir-senha' ||
    pathname === '/sessao-expirada'

  const {
    data: user,
    isLoading,
    isError,
    refetch,
  } = useQuery<UserProfile | null>({
    queryKey: ['auth-user-me'],
    queryFn: async () => {
      try {
        const data = await apiClient<UserProfile>('/auth/users/me')
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

  const ability = useMemo(() => {
    if (!user) {
      return defineAbilityFor({
        id: 'anonymous',
        role: 'employee',
      })
    }

    const rolePermissions = user.rolePermissions
      ?.map((rp) => rp.permission?.key)
      .filter((k): k is string => Boolean(k))

    const userPermissions = user.permissions
      ?.map((up) => {
        const key = up.key || up.permission?.key
        if (!key) return null
        return {
          permissionKey: key,
          effect: (up.effect as 'allow' | 'deny') || 'allow',
        }
      })
      .filter(
        (p): p is { permissionKey: string; effect: 'allow' | 'deny' } =>
          p !== null
      )

    const userToken: UserToken = {
      id: user.id,
      role: (user.role.key as 'admin' | 'employee' | 'supplier') || 'employee',
      rolePermissions,
      permissions: userPermissions,
    }

    return defineAbilityFor(userToken)
  }, [user])

  const logoutMutation = useMutation({
    mutationFn: () => apiClient('/auth/users/logout', { method: 'POST' }),
    onSuccess: () => {
      queryClient.setQueryData(['auth-user-me'], null)
      queryClient.clear()
      router.push('/login')
    },
  })

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync()
  }, [logoutMutation])

  const value = useMemo(
    () => ({
      user: user || null,
      ability,
      isLoading,
      isError,
      refetchUser: refetch,
      logout,
    }),
    [user, ability, isLoading, isError, refetch, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
