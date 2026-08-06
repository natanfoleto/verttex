'use client'

import { useCallback, useEffect, useState } from 'react'

import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
  removeRecentSearch,
} from '../lib/recent-searches'

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  useEffect(() => {
    setRecentSearches(getRecentSearches())
  }, [])

  const addSearch = useCallback((query: string) => {
    const updated = addRecentSearch(query)
    setRecentSearches(updated)
  }, [])

  const removeSearch = useCallback((query: string) => {
    const updated = removeRecentSearch(query)
    setRecentSearches(updated)
  }, [])

  const clearSearches = useCallback(() => {
    const updated = clearRecentSearches()
    setRecentSearches(updated)
  }, [])

  return {
    recentSearches,
    addSearch,
    removeSearch,
    clearSearches,
  }
}
