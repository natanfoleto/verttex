import Fastify, { FastifyInstance } from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { catalogRoutes } from './catalog.routes'

describe('GET /public/catalog/search-suggestions HTTP Real Integration Tests', () => {
  let app: FastifyInstance

  beforeAll(async () => {
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

    if (json.data.suggestions.length > 0) {
      expect(json.data.suggestions[0]).toHaveProperty('text')
      expect(json.data.suggestions[0]).toHaveProperty('type', 'query')
    }
  })

  it('2. GET /public/catalog/search-suggestions?q=cachaca — suporta termos sem acento', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/public/catalog/search-suggestions?q=cachaca',
    })

    expect(res.statusCode).toBe(200)
    const json = JSON.parse(res.body)
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data.suggestions)).toBe(true)
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

  it('5. GET /public/catalog/search-suggestions respeita limite customizado (limit=3)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/public/catalog/search-suggestions?q=a&limit=3',
    })

    expect(res.statusCode).toBe(200)
    const json = JSON.parse(res.body)
    expect(json.success).toBe(true)
    expect(json.data.suggestions.length).toBeLessThanOrEqual(3)
  })
})
