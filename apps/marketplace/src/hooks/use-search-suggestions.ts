'use client'

import { useQuery } from '@tanstack/react-query'

import { apiClient } from '../lib/api-client'

export interface SearchSuggestionItem {
  text: string
  type: 'query'
}

export interface SearchSuggestionsData {
  suggestions: SearchSuggestionItem[]
}

function normalizeSearchText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function useSearchSuggestions(debouncedQuery: string, limit = 8) {
  const cleanQuery = (debouncedQuery || '').trim()
  const normQuery = normalizeSearchText(cleanQuery)
  const isEnabled = normQuery.length >= 2

  return useQuery<SearchSuggestionItem[]>({
    queryKey: ['search-suggestions', normQuery, limit],
    queryFn: async ({ signal }) => {
      if (!isEnabled) {
        return []
      }

      try {
        const queryParams = new URLSearchParams({
          q: cleanQuery,
          limit: String(limit),
        })

        const res = await apiClient<
          { success: true; data: SearchSuggestionsData } | SearchSuggestionsData
        >(`/public/catalog/search-suggestions?${queryParams.toString()}`, {
          signal,
        })

        if ('data' in res && res.data?.suggestions) {
          return res.data.suggestions
        }
        if ('suggestions' in res && Array.isArray(res.suggestions)) {
          return res.suggestions
        }
        return []
      } catch (err: unknown) {
        if (
          err &&
          typeof err === 'object' &&
          'name' in err &&
          (err.name === 'AbortError' || err.name === 'CanceledError')
        ) {
          return []
        }
        throw err
      }
    },
    enabled: isEnabled,
    staleTime: 60_000,
    gcTime: 300_000,
    retry: false,
  })
}
