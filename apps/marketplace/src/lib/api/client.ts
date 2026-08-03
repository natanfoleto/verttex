import { apiClient } from '../api-client'

export async function fetchApi<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  return apiClient<T>(path, options)
}

export { apiClient }
