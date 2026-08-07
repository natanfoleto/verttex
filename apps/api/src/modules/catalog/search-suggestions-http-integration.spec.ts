import Fastify, { FastifyInstance } from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '../../infrastructure/database/prisma'
import { catalogRoutes } from './catalog.routes'
import { ProductSearchIndexService } from './product-search-index.service'

async function seedDeterministicSuggestionsDataset() {
  await prisma.$executeRaw`TRUNCATE TABLE product_search_documents, product_variations, products, categories, stores, brands CASCADE`

  const store = await prisma.store.create({
    data: {
      name: 'Loja Teste Sugestões',
      slug: 'loja-teste-sugestoes',
      status: 'active',
    },
  })

  const category = await prisma.category.create({
    data: {
      name: 'Mel e Derivados',
      slug: 'mel-e-derivados-sug',
    },
  })

  const pMel = await prisma.product.create({
    data: {
      storeId: store.id,
      categoryId: category.id,
      name: 'Mel Silvestre Artesanal 500g',
      slug: 'mel-silvestre-artesanal-500g',
      shortDescription: 'Mel natural de florada silvestre',
      status: 'active',
      isPublished: true,
    },
  })
  await ProductSearchIndexService.syncProductSearchDocument(pMel.id)

  const pCachaca = await prisma.product.create({
    data: {
      storeId: store.id,
      categoryId: category.id,
      name: 'Cachaça Artesanal Envelhecida 750ml',
      slug: 'cachaca-artesanal-envelhecida-750ml',
      shortDescription:
        'Cachaça de alambique envelhecida em barril de carvalho',
      status: 'active',
      isPublished: true,
    },
  })
  await ProductSearchIndexService.syncProductSearchDocument(pCachaca.id)
}

describe('GET /public/catalog/search-suggestions HTTP Real Integration Tests', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    await seedDeterministicSuggestionsDataset()

    app = Fastify({ logger: false })
    app.setValidatorCompiler(validatorCompiler)
    app.setSerializerCompiler(serializerCompiler)

    await app.register(catalogRoutes, { prefix: '/public/catalog' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('1. GET /public/catalog/search-suggestions?q=mel — retorna sugestões reais relacionadas a mel', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/public/catalog/search-suggestions?q=mel',
    })

    expect(res.statusCode).toBe(200)
    const json = JSON.parse(res.body)
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data.suggestions)).toBe(true)
    expect(json.data.suggestions.length).toBeGreaterThan(0)

    const hasMelMatch = json.data.suggestions.some((s: { text: string }) =>
      s.text.toLowerCase().includes('mel'),
    )
    expect(hasMelMatch).toBe(true)
    expect(json.data.suggestions[0]).toHaveProperty('type', 'query')
  })

  it('2. GET /public/catalog/search-suggestions?q=cachaca — suporta termo sem acento e preserva capitalização/acento humano original', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/public/catalog/search-suggestions?q=cachaca',
    })

    expect(res.statusCode).toBe(200)
    const json = JSON.parse(res.body)
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data.suggestions)).toBe(true)
    expect(json.data.suggestions.length).toBeGreaterThan(0)

    const hasOriginalHumanText = json.data.suggestions.some(
      (s: { text: string }) =>
        s.text.includes('Cachaça') || s.text.includes('cachaça'),
    )
    expect(hasOriginalHumanText).toBe(true)
  })

  it('3. GET /public/catalog/search-suggestions?q=termo-inexistente-xyz — retorna lista vazia quando nada coincide', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/public/catalog/search-suggestions?q=termo-inexistente-xyz',
    })

    expect(res.statusCode).toBe(200)
    const json = JSON.parse(res.body)
    expect(json.success).toBe(true)
    expect(json.data.suggestions).toEqual([])
  })

  it('4. GET /public/catalog/search-suggestions com q < 2 caracteres — retorna lista vazia imediatamente com 200 OK', async () => {
    const resShort = await app.inject({
      method: 'GET',
      url: '/public/catalog/search-suggestions?q=a',
    })

    expect(resShort.statusCode).toBe(200)
    const jsonShort = JSON.parse(resShort.body)
    expect(jsonShort.success).toBe(true)
    expect(jsonShort.data.suggestions).toEqual([])

    const resEmpty = await app.inject({
      method: 'GET',
      url: '/public/catalog/search-suggestions?q=',
    })

    expect(resEmpty.statusCode).toBe(200)
    const jsonEmpty = JSON.parse(resEmpty.body)
    expect(jsonEmpty.success).toBe(true)
    expect(jsonEmpty.data.suggestions).toEqual([])
  })

  it('5. GET /public/catalog/search-suggestions com termo de >=2 chars e limit=3 — trunca resultado para <=3', async () => {
    const resFull = await app.inject({
      method: 'GET',
      url: '/public/catalog/search-suggestions?q=mel',
    })
    const fullCount = JSON.parse(resFull.body).data.suggestions.length

    const res = await app.inject({
      method: 'GET',
      url: '/public/catalog/search-suggestions?q=mel&limit=3',
    })

    expect(res.statusCode).toBe(200)
    const json = JSON.parse(res.body)
    expect(json.success).toBe(true)
    expect(json.data.suggestions.length).toBeLessThanOrEqual(3)

    if (fullCount > 3) {
      expect(json.data.suggestions.length).toBe(3)
    }
  })
})
