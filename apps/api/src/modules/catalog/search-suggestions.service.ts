import { prisma } from '../../infrastructure/database/prisma'
import {
  SearchSuggestionsQuery,
  SearchSuggestionsResponse,
} from './search-suggestions.schemas'

function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export class SearchSuggestionsService {
  static async getSuggestions(
    query: SearchSuggestionsQuery,
  ): Promise<SearchSuggestionsResponse> {
    const rawQuery = (query.q || '').trim()
    const normQuery = normalizeText(rawQuery)

    // Less than 2 normalized characters -> return empty suggestions without database lookup
    if (normQuery.length < 2) {
      return { suggestions: [] }
    }

    const limit = Math.min(10, Math.max(1, Number(query.limit) || 8))

    // Token for candidate lookup
    const tokens = normQuery.split(/\s+/).filter(Boolean)
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
        titleNormalized: true,
        contextNormalized: true,
        attributesNormalized: true,
        descriptionNormalized: true,
      },
      take: 50,
    })

    if (!candidateDocs || candidateDocs.length === 0) {
      return { suggestions: [] }
    }

    // Extract unique human-readable text candidates from candidate documents
    const candidateSet = new Map<string, string>()

    const addCandidate = (text: string) => {
      const clean = text.trim()
      if (!clean) return
      const norm = normalizeText(clean)
      if (norm.length < 2) return
      if (!candidateSet.has(norm)) {
        candidateSet.set(norm, clean)
      }
    }

    for (const doc of candidateDocs) {
      if (doc.titleNormalized) {
        addCandidate(doc.titleNormalized)
      }
      if (doc.contextNormalized) {
        doc.contextNormalized.split(',').forEach(addCandidate)
      }
      if (doc.attributesNormalized) {
        doc.attributesNormalized.split(',').forEach(addCandidate)
      }
    }

    // Filter candidates that actually contain all tokens of normQuery
    const matchingCandidates: Array<{ norm: string; display: string }> = []

    for (const [norm, display] of candidateSet.entries()) {
      const allTokensMatch = tokens.every((token) => norm.includes(token))
      if (allTokensMatch) {
        matchingCandidates.push({ norm, display })
      }
    }

    // Ranking algorithm
    // 1. Exact match (norm === normQuery)
    // 2. Starts with query (norm.startsWith(normQuery))
    // 3. Word starts with query (word in norm starts with normQuery)
    // 4. Contains query (norm.includes(normQuery))
    // Tie-breaker: shorter length, then alphabetical localeCompare
    const getRankScore = (norm: string): number => {
      if (norm === normQuery) return 1
      if (norm.startsWith(normQuery)) return 2
      const words = norm.split(/\s+/)
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

      return a.norm.localeCompare(b.norm)
    })

    const topSuggestions = matchingCandidates
      .slice(0, limit)
      .map((c) => ({ text: c.display, type: 'query' as const }))

    return {
      suggestions: topSuggestions,
    }
  }
}
