import { describe, expect, it } from 'vitest'
import { prisma } from '../../infrastructure/database/prisma'
import { categoriesService, normalizeSlug } from './categories.service'

describe('CategoriesService Unit & Security Tests', () => {
  it('should correctly normalize category slugs removing special characters and accents', () => {
    expect(normalizeSlug('Queijos & Embutidos Artesanais')).toBe('queijos-embutidos-artesanais')
    expect(normalizeSlug('Doces da Vovó (Serra da Canastra)')).toBe('doces-da-vovo-serra-da-canastra')
  })

  it('should prevent setting a category as parent of itself', async () => {
    const existingCat = await prisma.category.findFirst({
      where: { deletedAt: null },
    })

    if (existingCat) {
      await expect(
        categoriesService.updateCategory(existingCat.id, { parentId: existingCat.id })
      ).rejects.toThrow('Uma categoria não pode ser definida como pai de si mesma')
    }
  })
})
