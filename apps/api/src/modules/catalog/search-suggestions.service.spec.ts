import { beforeEach, describe, expect, it, vi } from 'vitest'

import { prisma } from '../../infrastructure/database/prisma'
import { SearchSuggestionsService } from './search-suggestions.service'

vi.mock('../../infrastructure/database/prisma', () => ({
  prisma: {
    productSearchDocument: {
      findMany: vi.fn(),
    },
  },
}))

type MockCandidate = {
  productId: string
  product: {
    name: string
    category: { name: string } | null
    brand: { name: string } | null
    store: { name: string } | null
    options: Array<{ values: Array<{ value: string }> }>
  } | null
}

function mockPrismaDocs(docs: MockCandidate[]) {
  vi.mocked(prisma.productSearchDocument.findMany).mockResolvedValueOnce(
    docs as never,
  )
}

describe('SearchSuggestionsService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('1. Retorna [] sem chamar Prisma para query vazia ou apenas espaços', async () => {
    const resEmpty = await SearchSuggestionsService.getSuggestions({ q: '' })
    const resSpaces = await SearchSuggestionsService.getSuggestions({
      q: '   ',
    })

    expect(resEmpty).toEqual({ suggestions: [] })
    expect(resSpaces).toEqual({ suggestions: [] })
    expect(prisma.productSearchDocument.findMany).not.toHaveBeenCalled()
  })

  it('2. Retorna [] sem chamar Prisma para query com menos de 2 caracteres normalizados', async () => {
    const res = await SearchSuggestionsService.getSuggestions({ q: 'a' })

    expect(res).toEqual({ suggestions: [] })
    expect(prisma.productSearchDocument.findMany).not.toHaveBeenCalled()
  })

  it('3. Chama Prisma com filtros de produto/loja ativos, take 50 e orderBy productId asc para query >= 2 caracteres', async () => {
    mockPrismaDocs([])

    await SearchSuggestionsService.getSuggestions({ q: '  cachaça  ' })

    expect(prisma.productSearchDocument.findMany).toHaveBeenCalledWith({
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
        searchTextNormalized: { contains: 'cachaca' },
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
  })

  it('4. Preserva capitalização, acentos e texto humano original nos resultados', async () => {
    const docs: MockCandidate[] = [
      {
        productId: 'p1',
        product: {
          name: 'Cachaça Artesanal Ouro',
          category: { name: 'Bebidas Destiladas' },
          brand: { name: 'Alambique Salinas' },
          store: { name: 'Loja do Alambique' },
          options: [{ values: [{ value: 'Garrafa 750ml' }] }],
        },
      },
    ]
    mockPrismaDocs(docs)

    const res = await SearchSuggestionsService.getSuggestions({ q: 'cachaca' })

    expect(res.suggestions).toEqual([
      { text: 'Cachaça Artesanal Ouro', type: 'query' },
    ])
  })

  it('5. Realiza deduplicação (case e accent insensitive)', async () => {
    const docs: MockCandidate[] = [
      {
        productId: 'p1',
        product: {
          name: 'Cachaça Artesanal',
          category: { name: 'cachaça artesanal' },
          brand: { name: 'CACHAÇA ARTESANAL' },
          store: { name: 'Outra Loja' },
          options: [],
        },
      },
    ]
    mockPrismaDocs(docs)

    const res = await SearchSuggestionsService.getSuggestions({ q: 'cachaca' })

    const matches = res.suggestions.filter(
      (s) => s.text === 'Cachaça Artesanal',
    )
    expect(matches).toHaveLength(1)
  })

  it('6. Ordena sugestões por ranking determinístico (Exact > StartsWith > WordStartsWith > Contains)', async () => {
    const docs: MockCandidate[] = [
      {
        productId: 'p1',
        product: {
          name: 'Caramelizado',
          category: null,
          brand: null,
          store: null,
          options: [],
        },
      },
      {
        productId: 'p2',
        product: {
          name: 'Mel',
          category: null,
          brand: null,
          store: null,
          options: [],
        },
      },
      {
        productId: 'p3',
        product: {
          name: 'Mel Silvestre',
          category: null,
          brand: null,
          store: null,
          options: [],
        },
      },
      {
        productId: 'p4',
        product: {
          name: 'Puro Mel Orgânico',
          category: null,
          brand: null,
          store: null,
          options: [],
        },
      },
    ]
    mockPrismaDocs(docs)

    const res = await SearchSuggestionsService.getSuggestions({ q: 'mel' })

    expect(res.suggestions.map((s) => s.text)).toEqual([
      'Mel',
      'Mel Silvestre',
      'Puro Mel Orgânico',
      'Caramelizado',
    ])
  })

  it('7. Aplica limite default (8), customizado e teto máximo de 10', async () => {
    const mockCandidates: MockCandidate[] = Array.from(
      { length: 15 },
      (_, i) => ({
        productId: `p${i}`,
        product: {
          name: `Produto Mel ${i + 1}`,
          category: null,
          brand: null,
          store: null,
          options: [],
        },
      }),
    )

    mockPrismaDocs(mockCandidates)

    const resDefault = await SearchSuggestionsService.getSuggestions({
      q: 'mel',
    })
    expect(resDefault.suggestions).toHaveLength(8)

    mockPrismaDocs(mockCandidates)
    const resCustom = await SearchSuggestionsService.getSuggestions({
      q: 'mel',
      limit: 3,
    })
    expect(resCustom.suggestions).toHaveLength(3)

    mockPrismaDocs(mockCandidates)
    const resMax = await SearchSuggestionsService.getSuggestions({
      q: 'mel',
      limit: 50,
    })
    expect(resMax.suggestions).toHaveLength(10)
  })

  it('8. Retorna [] para termo sem correspondência', async () => {
    const docs: MockCandidate[] = [
      {
        productId: 'p1',
        product: {
          name: 'Queijo Canastra',
          category: null,
          brand: null,
          store: null,
          options: [],
        },
      },
    ]
    mockPrismaDocs(docs)

    const res = await SearchSuggestionsService.getSuggestions({
      q: 'xyz-inexistente',
    })
    expect(res).toEqual({ suggestions: [] })
  })

  it('9. Trata acentos, caixa, hífens/pontuação e espaços duplicados de forma consistente com a normalização canônica', async () => {
    const docs: MockCandidate[] = [
      {
        productId: 'p1',
        product: {
          name: 'Doce de Leite Viçosa',
          category: null,
          brand: null,
          store: null,
          options: [],
        },
      },
    ]

    mockPrismaDocs(docs)

    // Consulta com hífen, acento e caixa alta ("DOCE-DE-LEITE")
    const resHyphen = await SearchSuggestionsService.getSuggestions({
      q: 'DOCE-DE-LEITE',
    })

    expect(resHyphen.suggestions).toEqual([
      { text: 'Doce de Leite Viçosa', type: 'query' },
    ])
  })
})
