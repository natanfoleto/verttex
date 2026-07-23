import { describe, expect, it } from 'vitest'
import { normalizeSlug } from '../categories/categories.service'

describe('BrandsService Unit Tests', () => {
  it('should correctly normalize brand slugs', () => {
    expect(normalizeSlug('Queijaria Canastra® Premium')).toBe('queijaria-canastra-premium')
    expect(normalizeSlug('Laticínio São João')).toBe('laticinio-sao-joao')
  })
})
