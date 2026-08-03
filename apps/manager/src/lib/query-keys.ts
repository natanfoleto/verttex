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
  summary: (id: string) =>
    [...storeQueryKeys.details(), id, 'summary'] as const,
  /** Used by product form dropdowns. Invalidated by invalidateStores(). */
  dropdown: () => [...storeQueryKeys.all, 'dropdown'] as const,
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
  /** Used by user form dropdowns. Invalidated by invalidateRoles(). */
  dropdown: () => [...roleQueryKeys.all, 'dropdown'] as const,
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

export interface CategoryFilters {
  search?: string
  status?: string
  page?: number
  perPage?: number
}

export const categoryQueryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryQueryKeys.all, 'list'] as const,
  list: (filters?: CategoryFilters) =>
    [...categoryQueryKeys.lists(), filters ?? {}] as const,
  tree: () => [...categoryQueryKeys.all, 'tree'] as const,
  /** Used by product form dropdowns. Invalidated by invalidateCategories(). */
  dropdown: () => [...categoryQueryKeys.all, 'dropdown'] as const,
}

export interface BrandFilters {
  search?: string
  status?: string
  page?: number
  perPage?: number
}

export const brandQueryKeys = {
  all: ['brands'] as const,
  lists: () => [...brandQueryKeys.all, 'list'] as const,
  list: (filters?: BrandFilters) =>
    [...brandQueryKeys.lists(), filters ?? {}] as const,
  /** Used by product form dropdowns. Invalidated by invalidateBrands(). */
  dropdown: () => [...brandQueryKeys.all, 'dropdown'] as const,
}

/**
 * Standard Invalidator Helpers for Real-Time Instant Component Refreshing
 *
 * MANDATORY RULE: Always use these helpers in mutation onSuccess handlers.
 * Never invalidate only a specific sub-key (e.g. "categories-list") without
 * also invalidating the root (categoryQueryKeys.all) to cover all consumers
 * including dropdowns in other modules.
 */
export async function invalidateUsers(
  queryClient: QueryClient,
  userId?: string,
) {
  await queryClient.invalidateQueries({ queryKey: userQueryKeys.all })
  await queryClient.invalidateQueries({ queryKey: ['user-detail'] })
  if (userId) {
    await queryClient.invalidateQueries({ queryKey: ['user-detail', userId] })
    await queryClient.invalidateQueries({
      queryKey: userQueryKeys.detail(userId),
    })
  }
  await queryClient.invalidateQueries({ queryKey: ['dashboard-users-count'] })
}

export async function invalidateStores(
  queryClient: QueryClient,
  storeId?: string,
) {
  await queryClient.invalidateQueries({ queryKey: storeQueryKeys.all })
  await queryClient.invalidateQueries({ queryKey: ['store-detail'] })
  if (storeId) {
    await queryClient.invalidateQueries({
      queryKey: ['store-detail', storeId],
    })
    await queryClient.invalidateQueries({
      queryKey: storeQueryKeys.detail(storeId),
    })
  }
  // Also invalidate dropdown so product forms reflect new stores immediately
  await queryClient.invalidateQueries({ queryKey: storeQueryKeys.dropdown() })
  await queryClient.invalidateQueries({ queryKey: ['dashboard-stores-count'] })
}

export async function invalidateRoles(
  queryClient: QueryClient,
  roleId?: string,
) {
  await queryClient.invalidateQueries({ queryKey: roleQueryKeys.all })
  await queryClient.invalidateQueries({ queryKey: ['role-detail'] })
  if (roleId) {
    await queryClient.invalidateQueries({ queryKey: ['role-detail', roleId] })
    await queryClient.invalidateQueries({
      queryKey: roleQueryKeys.detail(roleId),
    })
  }
  // Also invalidate dropdown so user forms reflect new roles immediately
  await queryClient.invalidateQueries({ queryKey: roleQueryKeys.dropdown() })
  await queryClient.invalidateQueries({ queryKey: ['dashboard-roles-count'] })
}

export async function invalidateCategories(queryClient: QueryClient) {
  // Invalidate ALL category queries (list, tree, dropdown) in one call
  await queryClient.invalidateQueries({ queryKey: categoryQueryKeys.all })
}

export async function invalidateBrands(queryClient: QueryClient) {
  // Invalidate ALL brand queries (list, dropdown) in one call
  await queryClient.invalidateQueries({ queryKey: brandQueryKeys.all })
}
