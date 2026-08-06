import { formatApiErrorMessage } from './format-api-error'

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
        body: JSON.stringify({}),
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

export interface ApiClientOptions extends Omit<RequestInit, 'body'> {
  body?: BodyInit | null
  responseType?: 'json' | 'text' | 'blob'
}

export async function apiClient<TResponse = unknown>(
  endpoint: string,
  options: ApiClientOptions = {},
): Promise<TResponse> {
  const { responseType = 'json', ...fetchOptions } = options
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`
  const isFormData =
    typeof FormData !== 'undefined' && fetchOptions.body instanceof FormData

  let bodyToSend = fetchOptions.body
  if (
    bodyToSend &&
    !isFormData &&
    typeof bodyToSend === 'object' &&
    !(bodyToSend instanceof Blob) &&
    !(bodyToSend instanceof ArrayBuffer)
  ) {
    bodyToSend = JSON.stringify(bodyToSend)
  }

  const headers: Record<string, string> = {
    ...(fetchOptions.body && !isFormData
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...(fetchOptions.headers as Record<string, string>),
  }

  let response = await fetch(url, {
    ...fetchOptions,
    body: bodyToSend,
    headers,
    credentials: 'include',
  })

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
          ...fetchOptions,
          headers,
          credentials: 'include',
        })
      }
    } catch {
      // Refresh failed, fallback to standard error handling
    }
  }

  if (responseType === 'text') {
    if (!response.ok) {
      throw new ApiError(
        'HTTP_ERROR',
        'Ocorreu um erro ao processar o relatório',
        response.status,
      )
    }
    const text = await response.text()
    return text as unknown as TResponse
  }

  if (responseType === 'blob') {
    if (!response.ok) {
      throw new ApiError(
        'HTTP_ERROR',
        'Ocorreu um erro ao baixar o arquivo',
        response.status,
      )
    }
    const blob = await response.blob()
    return blob as unknown as TResponse
  }

  const data = await response.json().catch(() => null)

  if (!response.ok || (data && data.success === false)) {
    const errorData = data?.error
    const rawMessage =
      errorData?.message || 'Ocorreu um erro ao processar a requisição'
    const formattedMessage = formatApiErrorMessage(rawMessage)

    throw new ApiError(
      errorData?.code || 'HTTP_ERROR',
      formattedMessage,
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
