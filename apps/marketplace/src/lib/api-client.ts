/* eslint-disable @typescript-eslint/no-explicit-any */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    fieldErrors?: Record<string, string[]>
  }
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public fieldErrors?: Record<string, string[]>
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null

async function refreshTokenSilent(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise
  }

  isRefreshing = true
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/customers/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      const body = await res.json().catch(() => null)
      return res.ok && body?.success !== false
    } catch {
      return false
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })()

  return refreshPromise
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`

  const headers: Record<string, string> = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers as Record<string, string>),
  }

  let response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  })

  let data = await response.json().catch(() => null)

  // Silent automatic refresh mechanism for customer authentication
  const isAuthEndpoint =
    endpoint.includes('/auth/customers/login') ||
    endpoint.includes('/auth/customers/refresh') ||
    endpoint.includes('/auth/customers/logout')

  if (response.status === 401 && !isAuthEndpoint) {
    try {
      const refreshSuccess = await refreshTokenSilent()
      if (refreshSuccess) {
        response = await fetch(url, {
          ...options,
          headers,
          credentials: 'include',
        })
        data = await response.json().catch(() => null)
      }
    } catch {
      // Refresh failed, fallback to standard error
    }
  }

  if (!response.ok || (data && data.success === false)) {
    const errorData = data?.error
    throw new ApiError(
      errorData?.code || 'HTTP_ERROR',
      errorData?.message || 'Ocorreu um erro ao processar a requisição',
      response.status,
      errorData?.fieldErrors
    )
  }

  return data?.data !== undefined ? data.data : data
}
