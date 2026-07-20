import { storefrontEnv } from '@verttex/env/storefront'

export async function fetchApi<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const baseUrl = storefrontEnv.NEXT_PUBLIC_API_URL
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    let errorData
    try {
      errorData = await response.json()
    } catch {
      errorData = { error: { message: 'Erro desconhecido' } }
    }
    throw new Error(
      errorData?.error?.message || `HTTP error ${response.status}`,
    )
  }

  return response.json()
}
