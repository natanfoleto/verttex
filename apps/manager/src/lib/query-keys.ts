import type { QueryClient } from '@tanstack/react-query'

export interface StoreFilters {
  search?: string
  status?: string
  page?: number
  perPage?: number
}

export const storeQueryKeys = {
  all: ['stores'] as const,
  lists: () => [...storeQueryKeys.all, 'list'] as const,
  list: (filters: StoreFilters) =>
    [...storeQueryKeys.lists(), filters] as const,
  details: () => [...storeQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...storeQueryKeys.details(), id] as const,
}

export interface UserFilters {
  search?: string
  roleId?: string
  page?: number
  perPage?: number
}

export const userQueryKeys = {
  all: ['users'] as const,
  lists: () => [...userQueryKeys.all, 'list'] as const,
  list: (filters: UserFilters) => [...userQueryKeys.lists(), filters] as const,
  details: () => [...userQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...userQueryKeys.details(), id] as const,
}

export interface RoleFilters {
  search?: string
  page?: number
  perPage?: number
}

export const roleQueryKeys = {
  all: ['roles'] as const,
  lists: () => [...roleQueryKeys.all, 'list'] as const,
  list: (filters: RoleFilters) => [...roleQueryKeys.lists(), filters] as const,
  details: () => [...roleQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...roleQueryKeys.details(), id] as const,
}

export interface AuditFilters {
  search?: string
  userId?: string
  action?: string
  entity?: string
  page?: number
  perPage?: number
}

export const auditQueryKeys = {
  all: ['audit'] as const,
  lists: () => [...auditQueryKeys.all, 'list'] as const,
  list: (filters: AuditFilters) =>
    [...auditQueryKeys.lists(), filters] as const,
}

/**
 * Standard Invalidator Helpers for Real-Time Instant Component Refreshing
 */
export async function invalidateUsers(queryClient: QueryClient, userId?: string) {
  await queryClient.invalidateQueries({ queryKey: userQueryKeys.all })
  await queryClient.invalidateQueries({ queryKey: ['user-detail'] })
  if (userId) {
    await queryClient.invalidateQueries({ queryKey: ['user-detail', userId] })
    await queryClient.invalidateQueries({ queryKey: userQueryKeys.detail(userId) })
  }
  await queryClient.invalidateQueries({ queryKey: ['dashboard-users-count'] })
}

export async function invalidateStores(queryClient: QueryClient, storeId?: string) {
  await queryClient.invalidateQueries({ queryKey: storeQueryKeys.all })
  await queryClient.invalidateQueries({ queryKey: ['store-detail'] })
  if (storeId) {
    await queryClient.invalidateQueries({ queryKey: ['store-detail', storeId] })
    await queryClient.invalidateQueries({ queryKey: storeQueryKeys.detail(storeId) })
  }
  await queryClient.invalidateQueries({ queryKey: ['dashboard-stores-count'] })
}

export async function invalidateRoles(queryClient: QueryClient, roleId?: string) {
  await queryClient.invalidateQueries({ queryKey: roleQueryKeys.all })
  await queryClient.invalidateQueries({ queryKey: ['role-detail'] })
  if (roleId) {
    await queryClient.invalidateQueries({ queryKey: ['role-detail', roleId] })
    await queryClient.invalidateQueries({ queryKey: roleQueryKeys.detail(roleId) })
  }
  await queryClient.invalidateQueries({ queryKey: ['dashboard-roles-count'] })
}
