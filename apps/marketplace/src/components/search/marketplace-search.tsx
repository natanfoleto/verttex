'use client'

import { History, Loader2, Search, Trash2, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { useRecentSearches } from '../../hooks/use-recent-searches'
import { useSearchSuggestions } from '../../hooks/use-search-suggestions'

interface MarketplaceSearchProps {
  className?: string
  limit?: number
  debounceMs?: number
  onSearchSubmitted?: () => void
}

export function MarketplaceSearch({
  className = '',
  limit = 8,
  debounceMs = 200,
  onSearchSubmitted,
}: MarketplaceSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const baseId = useId()

  const initialQuery = searchParams?.get('q') || ''
  const [query, setQuery] = useState(initialQuery)
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery)
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { recentSearches, addSearch, removeSearch, clearSearches } =
    useRecentSearches()

  // Debounce for query typing
  useEffect(() => {
    if (debounceMs <= 0) {
      setDebouncedQuery(query)
      return
    }
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, debounceMs)
    return () => clearTimeout(timer)
  }, [query, debounceMs])

  // React Query hook for search suggestions
  const {
    data: suggestions = [],
    isLoading,
    isFetching,
  } = useSearchSuggestions(debouncedQuery, limit)

  const normQuery = query.trim().toLowerCase()
  const isAutocompleteMode = normQuery.length >= 2
  const activeItems = isAutocompleteMode
    ? suggestions.map((s) => s.text)
    : recentSearches

  // Reset active index if out of bounds when item list changes
  useEffect(() => {
    if (activeIndex >= activeItems.length) {
      setActiveIndex(-1)
    }
  }, [activeItems.length, activeIndex])

  const urlQ = searchParams?.get('q') || ''

  // Sync query with URL search params when URL query changes
  useEffect(() => {
    setQuery(urlQ)
  }, [urlQ])

  // Execute search navigation & add to recent searches
  const executeSearch = useCallback(
    (searchTerm: string) => {
      const cleanTerm = searchTerm.trim()
      if (!cleanTerm) return

      addSearch(cleanTerm)
      setIsOpen(false)
      setActiveIndex(-1)

      if (onSearchSubmitted) {
        onSearchSubmitted()
      }

      router.push(`/busca?q=${encodeURIComponent(cleanTerm)}`)
    },
    [addSearch, onSearchSubmitted, router],
  )

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (activeIndex >= 0 && activeItems[activeIndex]) {
      executeSearch(activeItems[activeIndex])
    } else {
      executeSearch(query)
    }
  }

  // Handle keyboard events (ArrowDown, ArrowUp, Enter, Escape, Tab)
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0 && activeItems[activeIndex]) {
        executeSearch(activeItems[activeIndex])
      } else {
        executeSearch(query)
      }
      return
    }

    if (e.key === 'Escape') {
      setIsOpen(false)
      setActiveIndex(-1)
      return
    }

    if (e.key === 'Tab') {
      setIsOpen(false)
      setActiveIndex(-1)
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
        setActiveIndex(0)
        return
      }
      if (activeItems.length === 0) return
      setActiveIndex((prev) => (prev + 1 < activeItems.length ? prev + 1 : 0))
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
        setActiveIndex(activeItems.length > 0 ? activeItems.length - 1 : 0)
        return
      }
      if (activeItems.length === 0) return
      setActiveIndex((prev) =>
        prev - 1 >= 0 ? prev - 1 : activeItems.length - 1,
      )
    }
  }

  // Outside click handler
  useEffect(() => {
    const handlePointerDownOutside = (event: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setActiveIndex(-1)
      }
    }

    document.addEventListener('pointerdown', handlePointerDownOutside)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDownOutside)
    }
  }, [])

  const listboxId = `${baseId}-listbox`
  const activeOptionId =
    activeIndex >= 0 ? `${baseId}-option-${activeIndex}` : undefined

  const showRecentDropdown = !isAutocompleteMode && recentSearches.length > 0
  const showSuggestionsDropdown =
    isAutocompleteMode && (suggestions.length > 0 || isLoading || isFetching)
  const showEmptyAutocomplete =
    isAutocompleteMode && !isLoading && !isFetching && suggestions.length === 0

  const shouldRenderDropdown =
    isOpen &&
    (showRecentDropdown || showSuggestionsDropdown || showEmptyAutocomplete)

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <form
        onSubmit={handleSubmit}
        className="relative flex w-full items-center"
      >
        <div className="relative flex w-full items-center overflow-hidden rounded-md border border-stone-200 bg-white shadow-sm focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600">
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              if (!isOpen) setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar produtos, marcas e muito mais..."
            className="w-full border-none bg-transparent px-4 py-2.5 text-sm placeholder:text-stone-500 focus:outline-none focus-visible:ring-0"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={shouldRenderDropdown}
            aria-controls={shouldRenderDropdown ? listboxId : undefined}
            aria-activedescendant={activeOptionId}
          />

          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setQuery('')
                setDebouncedQuery('')
                inputRef.current?.focus()
              }}
              className="mr-1 h-7 w-7 cursor-pointer p-0 text-stone-400 transition-colors hover:bg-transparent hover:text-stone-700"
              aria-label="Limpar texto"
            >
              <X className="h-4 w-4" />
            </Button>
          )}

          <div className="h-5 w-px shrink-0 bg-stone-200" />

          <Button
            type="submit"
            variant="ghost"
            className="h-auto cursor-pointer px-3.5 py-2.5 text-stone-500 transition-colors hover:bg-transparent hover:text-emerald-600"
            title="Buscar"
            aria-label="Buscar"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </form>

      {/* Autocomplete & Recent Searches Dropdown */}
      {shouldRenderDropdown && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute top-full left-0 z-50 mt-1 w-full overflow-hidden rounded-md border border-stone-200 bg-white shadow-lg"
        >
          {/* Mode 1: Recent Searches */}
          {showRecentDropdown && (
            <div className="p-2">
              <div className="mb-1 flex items-center justify-between px-2 text-xs font-semibold text-stone-500">
                <span className="flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5 text-stone-400" />
                  Pesquisas recentes
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => clearSearches()}
                  className="h-auto cursor-pointer p-0 text-xs font-normal text-stone-400 hover:bg-transparent hover:text-stone-700"
                >
                  Limpar
                </Button>
              </div>

              <div className="flex flex-col">
                {recentSearches.map((item, index) => {
                  const isSelected = index === activeIndex
                  const itemOptionId = `${baseId}-option-${index}`
                  return (
                    <div
                      key={`recent-${item}-${index}`}
                      id={itemOptionId}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => executeSearch(item)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={`group flex cursor-pointer items-center justify-between rounded-sm px-2.5 py-2 text-sm transition-colors ${
                        isSelected
                          ? 'bg-stone-100 font-medium text-emerald-800'
                          : 'text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <span className="truncate">{item}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeSearch(item)
                        }}
                        className="h-6 w-6 cursor-pointer p-0 text-stone-300 transition-colors hover:bg-transparent hover:text-red-500"
                        title="Remover das pesquisas recentes"
                        aria-label={`Remover ${item} das pesquisas recentes`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Mode 2: Autocomplete Text Suggestions */}
          {showSuggestionsDropdown && (
            <div className="p-2">
              {(isLoading || isFetching) && suggestions.length === 0 && (
                <div className="flex items-center justify-center gap-2 py-4 text-xs text-stone-400">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                  <span>Buscando sugestões...</span>
                </div>
              )}

              {suggestions.length > 0 && (
                <div className="flex flex-col">
                  {suggestions.map((sug, index) => {
                    const isSelected = index === activeIndex
                    const itemOptionId = `${baseId}-option-${index}`
                    return (
                      <div
                        key={`sug-${sug.text}-${index}`}
                        id={itemOptionId}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => executeSearch(sug.text)}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={`flex cursor-pointer items-center gap-2.5 rounded-sm px-2.5 py-2 text-sm transition-colors ${
                          isSelected
                            ? 'bg-emerald-50 font-semibold text-emerald-900'
                            : 'text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <Search className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                        <span className="truncate">{sug.text}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Mode 3: Empty Autocomplete */}
          {showEmptyAutocomplete && (
            <div className="px-4 py-3 text-center text-xs text-stone-400">
              Nenhuma sugestão encontrada para &quot;{query}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  )
}
