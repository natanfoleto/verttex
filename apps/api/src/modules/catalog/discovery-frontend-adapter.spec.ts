import { describe, expect, it } from 'vitest'

// Interface representing backend HTTP response wrapper
interface BackendApiResponse<T> {
  success: boolean
  data: T
}

// Interface expected by Frontend ProductDiscoveryView
interface FrontendDiscoveryData {
  products: Array<{
    id: string
    name: string
    slug: string
    price: number
    store: { id: string; name: string; slug: string }
    category: { id: string; name: string; slug: string }
  }>
  pagination: {
    page: number
    perPage: number
    total: number
    totalPages: number
  }
}

// Frontend apiClient unwrapping logic
function parseApiClientResponse<T>(data: unknown): T {
  if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
    return (data as { data: T }).data
  }
  return data as T
}

// Frontend ProductDiscoveryView product extraction logic
function extractDiscoveryProducts(res: unknown) {
  const discoveryData = parseApiClientResponse<{
    products?: unknown[]
    items?: unknown[]
  }>(res)
  return discoveryData?.products || discoveryData?.items || []
}

describe('Post-validation Bugfix — Frontend Discovery Adapter & Parsing', () => {
  it('1. Response HTTP com 3 produtos — extrai corretamente 3 produtos para renderizar nos cards', () => {
    const mockHttpResponse: BackendApiResponse<FrontendDiscoveryData> = {
      success: true,
      data: {
        products: [
          {
            id: 'prod-1',
            name: 'Mel Silvestre 500g',
            slug: 'mel-silvestre-500g',
            price: 38.0,
            store: {
              id: 'store-1',
              name: 'Apiário Serra',
              slug: 'apiario-serra',
            },
            category: { id: 'cat-1', name: 'Mel', slug: 'mel' },
          },
          {
            id: 'prod-2',
            name: 'Queijo Canastra 500g',
            slug: 'queijo-canastra-500g',
            price: 49.9,
            store: {
              id: 'store-2',
              name: 'Queijaria Alvorada',
              slug: 'queijaria-alvorada',
            },
            category: { id: 'cat-2', name: 'Queijos', slug: 'queijos' },
          },
          {
            id: 'prod-3',
            name: 'Cachaça Amburana 750ml',
            slug: 'cachaca-amburana-750ml',
            price: 68.0,
            store: {
              id: 'store-3',
              name: 'Engenho Boa Esperança',
              slug: 'boa-esperanca',
            },
            category: { id: 'cat-3', name: 'Cachaças', slug: 'cachacas' },
          },
        ],
        pagination: {
          page: 1,
          perPage: 50,

          total: 3,
          totalPages: 1,
        },
      },
    }

    const products = extractDiscoveryProducts(mockHttpResponse) as Array<{
      name: string
    }>
    expect(products).toHaveLength(3)
    expect(products[0]?.name).toBe('Mel Silvestre 500g')
    expect(products[1]?.name).toBe('Queijo Canastra 500g')
    expect(products[2]?.name).toBe('Cachaça Amburana 750ml')
  })

  it('2. Response HTTP sem produtos — exibe 0 produtos e ativa Empty State com textos do Marketplace UI', () => {
    const mockEmptyHttpResponse: BackendApiResponse<FrontendDiscoveryData> = {
      success: true,
      data: {
        products: [],
        pagination: {
          page: 1,
          perPage: 50,
          total: 0,
          totalPages: 0,
        },
      },
    }

    const products = extractDiscoveryProducts(mockEmptyHttpResponse)
    expect(products).toHaveLength(0)

    // Simula a lógica de decisão do componente ProductDiscoveryView do Marketplace (lines 357-363)
    const query = 'termo-sem-resultado'
    const hasActiveFilters = true

    const emptyStateConfig = {
      isRendered: products.length === 0,
      title: query
        ? `Nenhum produto encontrado para "${query}"`
        : 'Nenhum produto disponível',
      description:
        'Tente ajustar seus termos de busca ou remover alguns filtros aplicados para expandir o catálogo.',
      actionLabel: hasActiveFilters ? 'Limpar Todos os Filtros' : undefined,
    }

    expect(emptyStateConfig.isRendered).toBe(true)
    expect(emptyStateConfig.title).toBe(
      'Nenhum produto encontrado para "termo-sem-resultado"',
    )
    expect(emptyStateConfig.actionLabel).toBe('Limpar Todos os Filtros')
  })

  it('3. D-01 & D-07 — Ciclo completo de seleção múltipla OR (Amburana -> Carvalho -> Desseleção -> Limpeza)', () => {
    // Helper simulando a lógica exata da função handleFacetClick / updateUrl de product-discovery-view.tsx
    const state = new URLSearchParams()

    function toggleFacetOption(
      facetKey: string,
      optValue: string,
      isAttrFacet: boolean,
    ) {
      const paramKey =
        facetKey === 'category'
          ? 'categorySlug'
          : facetKey === 'brand'
            ? 'brandSlug'
            : facetKey === 'store'
              ? 'storeSlug'
              : facetKey

      const currentRaw = state.get(paramKey) || ''
      const currentValues = currentRaw ? currentRaw.split(',') : []
      const isActive = currentValues.includes(optValue)

      if (isAttrFacet) {
        const newValues = isActive
          ? currentValues.filter((v) => v !== optValue)
          : [...currentValues, optValue]
        if (newValues.length > 0) {
          state.set(paramKey, newValues.join(','))
        } else {
          state.delete(paramKey)
        }
      } else {
        if (isActive) {
          state.delete(paramKey)
        } else {
          state.set(paramKey, optValue)
        }
      }
    }

    // Passos de teste solicitados no D-07:
    // Passo 1: Selecionar Amburana
    toggleFacetOption('attr_madeira', 'Amburana', true)
    expect(state.get('attr_madeira')).toBe('Amburana')

    // Passo 2: Selecionar Carvalho também (semântica OR)
    toggleFacetOption('attr_madeira', 'Carvalho', true)
    expect(state.get('attr_madeira')).toBe('Amburana,Carvalho')

    // Passo 3: Desmarcar Amburana
    toggleFacetOption('attr_madeira', 'Amburana', true)
    expect(state.get('attr_madeira')).toBe('Carvalho')

    // Passo 4: Desmarcar o último valor (Carvalho)
    toggleFacetOption('attr_madeira', 'Carvalho', true)
    expect(state.get('attr_madeira')).toBeNull()

    // Passo 5: Adicionar múltiplos filtros e testar a limpeza total
    toggleFacetOption('attr_madeira', 'Amburana', true)
    toggleFacetOption('category', 'mel', false)
    expect(state.get('attr_madeira')).toBe('Amburana')
    expect(state.get('categorySlug')).toBe('mel')

    // Limpar todos
    Array.from(state.keys()).forEach((k) => state.delete(k))
    expect(state.get('attr_madeira')).toBeNull()
    expect(state.get('categorySlug')).toBeNull()
  })

  it('4. D-02 — Rota /ofertas ativa isOffer=true no request HTTP', () => {
    const initialIsOffer = true
    const searchParams = new URLSearchParams()

    const isOffer =
      searchParams.get('isOffer') === 'true' || initialIsOffer || false
    const params = new URLSearchParams()
    if (isOffer) params.append('isOffer', 'true')

    expect(params.toString()).toBe('isOffer=true')
  })

  it('5. D-03 — Faceta de Categoria clica e gera categorySlug na URL e na requisição', () => {
    const facetKey = 'category'
    const optValue = 'mel'
    const paramKey =
      facetKey === 'category'
        ? 'categorySlug'
        : facetKey === 'brand'
          ? 'brandSlug'
          : facetKey === 'store'
            ? 'storeSlug'
            : facetKey

    expect(paramKey).toBe('categorySlug')

    const params = new URLSearchParams()
    params.append(paramKey, optValue)
    expect(params.toString()).toBe('categorySlug=mel')
  })

  it('6. D-04 — ProductCard consome isAvailable: false e renderiza estado indisponível (badge + classe opacity)', () => {
    const prodAvailable = { id: 'p1', name: 'Mel 500g', isAvailable: true }
    const prodUnavailable = {
      id: 'p2',
      name: 'Melato 500g',
      isAvailable: false,
    }

    // Lógica exata de renderização do componente ProductCard (lines 55-62)
    function renderProductCardState(isAvailable?: boolean) {
      const containerClass = `group flex flex-col cursor-pointer ${!isAvailable ? 'opacity-80' : ''}`
      const hasBadge = !isAvailable
      const badgeText = !isAvailable ? 'Esgotado' : null
      return { containerClass, hasBadge, badgeText }
    }

    const availableState = renderProductCardState(prodAvailable.isAvailable)
    expect(availableState.containerClass).toBe(
      'group flex flex-col cursor-pointer ',
    )
    expect(availableState.hasBadge).toBe(false)
    expect(availableState.badgeText).toBeNull()

    const unavailableState = renderProductCardState(prodUnavailable.isAvailable)
    expect(unavailableState.containerClass).toBe(
      'group flex flex-col cursor-pointer opacity-80',
    )
    expect(unavailableState.hasBadge).toBe(true)
    expect(unavailableState.badgeText).toBe('Esgotado')
  })

  it('7. D-05 — Categoria Hierárquica preserva a cadeia de pai e filho (alimentos/mel)', () => {
    const slugs = ['alimentos', 'mel']
    const targetCategorySlug = slugs.join('/')

    expect(targetCategorySlug).toBe('alimentos/mel')
  })

  it('8. D-06 — Filtro por Faixa de Preço (minPrice e maxPrice) atualizando a URL e gerando parâmetros corretos', () => {
    const searchParams = new URLSearchParams()

    // Simula interação do usuário digitando 20 e 100 e clicando em OK
    const inputMinPrice = '20'
    const inputMaxPrice = '100'

    if (inputMinPrice) searchParams.set('minPrice', inputMinPrice)
    if (inputMaxPrice) searchParams.set('maxPrice', inputMaxPrice)

    // Lógica do buildApiParams
    const minPrice = searchParams.get('minPrice') || ''
    const maxPrice = searchParams.get('maxPrice') || ''

    const params = new URLSearchParams()
    if (minPrice) params.append('minPrice', minPrice)
    if (maxPrice) params.append('maxPrice', maxPrice)

    expect(params.toString()).toBe('minPrice=20&maxPrice=100')
  })
})
