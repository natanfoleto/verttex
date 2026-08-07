import { describe, expect, it } from 'vitest'

import { buildHomeProductSections } from './home-products'

describe('buildHomeProductSections', () => {
  it('exposes only real offers and never fabricates commercial benefits', () => {
    const sections = buildHomeProductSections([
      {
        id: 'real-offer',
        name: 'Mel artesanal',
        price: 30,
        promotionalPrice: 24,
        slug: 'mel-artesanal',
      },
      {
        id: 'invalid-offer',
        name: 'Queijo regional',
        price: 40,
        promotionalPrice: 40,
        slug: 'queijo-regional',
      },
    ])

    expect(sections.offerProducts).toHaveLength(1)
    expect(sections.offerProducts[0]).toMatchObject({
      id: 'real-offer',
      originalPrice: 30,
      price: 24,
    })
    expect(sections.catalogProducts[1]).toMatchObject({
      id: 'invalid-offer',
      price: 40,
    })
    expect(sections.catalogProducts[1]).not.toHaveProperty('originalPrice')

    for (const product of sections.catalogProducts) {
      expect(product).not.toHaveProperty('installments')
      expect(product).not.toHaveProperty('benefitBadge')
      expect(product).not.toHaveProperty('freeShipping')
      expect(product).not.toHaveProperty('discountPercent')
    }
  })
})
