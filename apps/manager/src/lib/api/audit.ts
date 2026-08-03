import { apiClient } from '../api-client'
import type { AuditFilters } from '../query-keys'

export interface AuditLogUser {
  id: string
  name: string
  email: string
  role: {
    key: string
    name: string
  }
}

export interface AuditLogEntry {
  id: string
  userId: string | null
  action: string
  entity: string
  entityId: string | null
  oldValues: Record<string, unknown> | null
  newValues: Record<string, unknown> | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  user: AuditLogUser | null
}

export interface AuditFilterOptions {
  actions: string[]
  entities: string[]
  users: Array<{ id: string; name: string; email: string }>
}

export interface AuditListResponse {
  success: boolean
  data: {
    logs: AuditLogEntry[]
    filters: AuditFilterOptions
  }
  meta: {
    page: number
    perPage: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export async function listAuditLogs(
  filters: AuditFilters,
): Promise<AuditListResponse> {
  const params = new URLSearchParams()

  params.set('page', String(filters.page ?? 1))
  params.set('perPage', String(filters.perPage ?? 20))
  if (filters.search) params.set('search', filters.search)
  if (filters.userId) params.set('userId', filters.userId)
  if (filters.action) params.set('action', filters.action)
  if (filters.entity) params.set('entity', filters.entity)

  // apiClient returns the full response when 'meta' is present (see api-client.ts)
  return apiClient<AuditListResponse>(`/audit?${params.toString()}`)
}
