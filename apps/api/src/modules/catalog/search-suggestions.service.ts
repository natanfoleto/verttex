import { prisma } from '../../infrastructure/database/prisma'
import { normalizeSearchText } from './product-search-index.service'
import {
  SearchSuggestionsQuery,
  SearchSuggestionsResponse,
} from './search-suggestions.schemas'

export class SearchSuggestionsService {
  static async getSuggestions(
    query: SearchSuggestionsQuery,
  ): Promise<SearchSuggestionsResponse> {
    const rawQuery = (query.q || '').trim()
    const normQuery = normalizeSearchText(rawQuery)

    // Less than 2 normalized characters -> return empty suggestions without database lookup
    if (normQuery.length < 2) {
      return { suggestions: [] }
    }

    const limit = Math.min(10, Math.max(1, Number(query.limit) || 8))

    // Tokens for candidate lookup
    const tokens = normQuery.split(' ').filter(Boolean)
    const anchorToken = tokens[0] || normQuery

    const candidateDocs = await prisma.productSearchDocument.findMany({
      where: {
        product: {
          status: 'active',
          isPublished: true,
          deletedAt: null,
          store: {
            status: 'active',
            deletedAt: null,
          },
        },
        searchTextNormalized: { contains: anchorToken },
      },
      select: {
        productId: true,
        product: {
          select: {
            name: true,
            category: {
              select: { name: true },
            },
            brand: {
              select: { name: true },
            },
            store: {
              select: { name: true },
            },
            options: {
              select: {
                values: {
                  select: { value: true },
                },
              },
            },
          },
        },
      },
      orderBy: {
        productId: 'asc',
      },
      take: 50,
    })

    if (!candidateDocs || candidateDocs.length === 0) {
      return { suggestions: [] }
    }

    // Extract unique human-readable text candidates from real catalog relations
    const candidateMap = new Map<string, string>()

    const addCandidate = (displayText?: string | null) => {
      if (!displayText) return
      const clean = displayText.trim()
      if (!clean) return
      const norm = normalizeSearchText(clean)
      if (norm.length < 2) return

      if (!candidateMap.has(norm)) {
        candidateMap.set(norm, clean)
      }
    }

    for (const doc of candidateDocs) {
      const p = doc.product
      if (!p) continue

      addCandidate(p.name)
      if (p.category) {
        addCandidate(p.category.name)
      }
      if (p.brand) {
        addCandidate(p.brand.name)
      }
      if (p.store) {
        addCandidate(p.store.name)
      }
      if (p.options && Array.isArray(p.options)) {
        for (const opt of p.options) {
          if (opt.values && Array.isArray(opt.values)) {
            for (const val of opt.values) {
              addCandidate(val.value)
            }
          }
        }
      }
    }

    // Filter candidates that contain all tokens of normQuery
    const matchingCandidates: Array<{ norm: string; display: string }> = []

    for (const [norm, display] of candidateMap.entries()) {
      const allTokensMatch = tokens.every((token) => norm.includes(token))
      if (allTokensMatch) {
        matchingCandidates.push({ norm, display })
      }
    }

    // Deterministic Ranking Algorithm:
    // 1. Exact match (norm === normQuery)
    // 2. Starts with query (norm.startsWith(normQuery))
    // 3. Word starts with query (word in norm starts with normQuery)
    // 4. Contains query (norm.includes(normQuery))
    // Tie-breaker: shorter length, then localeCompare on norm, then display
    const getRankScore = (norm: string): number => {
      if (norm === normQuery) return 1
      if (norm.startsWith(normQuery)) return 2
      const words = norm.split(' ')
      if (words.some((w) => w.startsWith(normQuery))) return 3
      if (norm.includes(normQuery)) return 4
      return 5
    }

    matchingCandidates.sort((a, b) => {
      const rankA = getRankScore(a.norm)
      const rankB = getRankScore(b.norm)
      if (rankA !== rankB) return rankA - rankB

      if (a.norm.length !== b.norm.length) {
        return a.norm.length - b.norm.length
      }

      const normComp = a.norm.localeCompare(b.norm)
      if (normComp !== 0) return normComp

      return a.display.localeCompare(b.display)
    })

    const topSuggestions = matchingCandidates
      .slice(0, limit)
      .map((c) => ({ text: c.display, type: 'query' as const }))

    return {
      suggestions: topSuggestions,
    }
  }
}
