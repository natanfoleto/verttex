import { FastifyReply, FastifyRequest } from 'fastify'

import { PublicProductListQuery, PublicStoreListQuery } from './catalog.schemas'
import { PublicCatalogService } from './catalog.service'
import { DiscoveryQuery } from './discovery.schemas'
import { PublicDiscoveryService } from './discovery.service'
import { SearchSuggestionsQuery } from './search-suggestions.schemas'
import { SearchSuggestionsService } from './search-suggestions.service'

export async function listPublicProductsController(
  req: FastifyRequest<{ Querystring: PublicProductListQuery }>,
  reply: FastifyReply,
) {
  const result = await PublicCatalogService.listPublicProducts(req.query)
  return reply.status(200).send({
    success: true,
    data: result.data,
    meta: result.meta,
  })
}

export async function discoverPublicProductsController(
  req: FastifyRequest<{ Querystring: DiscoveryQuery }>,
  reply: FastifyReply,
) {
  const rawQuery = req.query as Record<string, unknown>
  const rawAttributes =
    typeof rawQuery.attributes === 'object' && rawQuery.attributes !== null
      ? (rawQuery.attributes as Record<string, string | string[]>)
      : {}

  const attributes: Record<string, string | string[]> = {
    ...rawAttributes,
  }

  for (const [key, val] of Object.entries(rawQuery)) {
    if (
      key.startsWith('attr_') &&
      val !== undefined &&
      typeof val === 'string'
    ) {
      const cleanKey = key.replace(/^attr_/, '')
      attributes[cleanKey] = val
    }
  }

  const qParam = typeof req.query.q === 'string' ? req.query.q : undefined
  const searchParam =
    typeof req.query.search === 'string' ? req.query.search : undefined
  const queryParam =
    typeof req.query.query === 'string' ? req.query.query : undefined

  const canonicalSearch =
    (qParam || searchParam || queryParam || '').trim().slice(0, 200) ||
    undefined

  const queryPayload: DiscoveryQuery = {
    ...req.query,
    search: canonicalSearch,
    attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
  }

  const result = await PublicDiscoveryService.discover(queryPayload)
  return reply.status(200).send({
    success: true,
    data: result,
  })
}

export async function getPublicProductDetailsController(
  req: FastifyRequest<{ Params: { slug: string } }>,
  reply: FastifyReply,
) {
  const product = await PublicCatalogService.getPublicProductDetails(
    req.params.slug,
  )
  return reply.status(200).send({
    success: true,
    data: product,
  })
}

export async function listPublicCategoriesController(
  _req: FastifyRequest,
  reply: FastifyReply,
) {
  const categories = await PublicCatalogService.listPublicCategories()
  return reply.status(200).send({
    success: true,
    data: categories,
  })
}

export async function listPublicBrandsController(
  _req: FastifyRequest,
  reply: FastifyReply,
) {
  const brands = await PublicCatalogService.listPublicBrands()
  return reply.status(200).send({
    success: true,
    data: brands,
  })
}

export async function listPublicStoresController(
  req: FastifyRequest<{ Querystring: PublicStoreListQuery }>,
  reply: FastifyReply,
) {
  const result = await PublicCatalogService.listPublicStores(req.query)
  return reply.status(200).send({
    success: true,
    data: result.data,
    meta: result.meta,
  })
}

export async function getPublicStoreDetailsController(
  req: FastifyRequest<{ Params: { slug: string } }>,
  reply: FastifyReply,
) {
  const store = await PublicCatalogService.getPublicStoreDetails(
    req.params.slug,
  )
  return reply.status(200).send({
    success: true,
    data: store,
  })
}

export async function getSearchSuggestionsController(
  req: FastifyRequest<{ Querystring: SearchSuggestionsQuery }>,
  reply: FastifyReply,
) {
  const result = await SearchSuggestionsService.getSuggestions(req.query)
  return reply.status(200).send({
    success: true,
    data: result,
  })
}
