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
    public fieldErrors?: Record<string, string[]>,
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
      const res = await fetch(`${API_URL}/auth/users/refresh`, {
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
  options: RequestInit = {},
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

  // Silent automatic refresh mechanism when 401 occurs on non-auth routes
  const isAuthEndpoint =
    endpoint.includes('/auth/users/login') ||
    endpoint.includes('/auth/users/refresh') ||
    endpoint.includes('/auth/users/logout')

  if (response.status === 401 && !isAuthEndpoint) {
    try {
      const refreshSuccess = await refreshTokenSilent()
      if (refreshSuccess) {
        // Retry original request with renewed access token
        response = await fetch(url, {
          ...options,
          headers,
          credentials: 'include',
        })
        data = await response.json().catch(() => null)
      }
    } catch {
      // Refresh failed, fallback to standard error handling
    }
  }

  if (!response.ok || (data && data.success === false)) {
    const errorData = data?.error
    throw new ApiError(
      errorData?.code || 'HTTP_ERROR',
      errorData?.message || 'Ocorreu um erro ao processar a requisição',
      response.status,
      errorData?.fieldErrors,
    )
  }

  if (data && typeof data === 'object') {
    if (data.meta !== undefined) {
      return data
    }
    if (data.data !== undefined) {
      return data.data
    }
  }

  return data
}
