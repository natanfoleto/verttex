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
