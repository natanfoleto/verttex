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

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`

  const headers: Record<string, string> = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers as Record<string, string>),
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  })

  const data = await response.json().catch(() => null)

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
