import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import {
  discoverPublicProductsController,
  getPublicProductDetailsController,
  getPublicStoreDetailsController,
  getSearchSuggestionsController,
  listPublicBrandsController,
  listPublicCategoriesController,
  listPublicProductsController,
  listPublicStoresController,
} from './catalog.controller'
import {
  publicProductListQuerySchema,
  publicStoreListQuerySchema,
} from './catalog.schemas'
import { discoveryQuerySchema } from './discovery.schemas'
import { searchSuggestionsQuerySchema } from './search-suggestions.schemas'

export async function catalogRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>()

  // Public Product Discovery Engine (Unified Search, Categories, Brands, Stores, Facets, SEO)
  typedApp.get(
    '/discover',
    {
      schema: {
        tags: ['Public Catalog — Marketplace'],
        summary:
          'Product Discovery Engine: busca unificada, categorias, facetas, ordenação, breadcrumbs e SEO',
        querystring: discoveryQuerySchema,
      },
    },
    discoverPublicProductsController,
  )

  // Public Products Catalog Listing
  typedApp.get(
    '/products',
    {
      schema: {
        tags: ['Public Catalog — Marketplace'],
        summary:
          'Listar produtos públicos com busca, filtros (categoria, marca, preço) e estoque FEFO',
        querystring: publicProductListQuerySchema,
      },
    },
    listPublicProductsController,
  )

  // Public Product Details by Slug/ID
  typedApp.get(
    '/products/:slug',
    {
      schema: {
        tags: ['Public Catalog — Marketplace'],
        summary: 'Obter detalhes públicos do produto por slug ou ID',
        params: z.object({ slug: z.string() }),
      },
    },
    getPublicProductDetailsController,
  )

  // Public Categories Hierarchy
  typedApp.get(
    '/categories',
    {
      schema: {
        tags: ['Public Catalog — Marketplace'],
        summary:
          'Listar categorias públicas ativas com hierarquia e contagem de produtos',
      },
    },
    listPublicCategoriesController,
  )

  // Public Brands
  typedApp.get(
    '/brands',
    {
      schema: {
        tags: ['Public Catalog — Marketplace'],
        summary: 'Listar marcas públicas ativas',
      },
    },
    listPublicBrandsController,
  )

  // Public Stores Showcase
  typedApp.get(
    '/stores',
    {
      schema: {
        tags: ['Public Catalog — Marketplace'],
        summary: 'Listar produtoras e lojas parceiras ativas no marketplace',
        querystring: publicStoreListQuerySchema,
      },
    },
    listPublicStoresController,
  )

  // Public Store Details by Slug
  typedApp.get(
    '/stores/:slug',
    {
      schema: {
        tags: ['Public Catalog — Marketplace'],
        summary: 'Obter detalhes públicos de uma loja parceira por slug',
        params: z.object({ slug: z.string() }),
      },
    },
    getPublicStoreDetailsController,
  )

  // Public Search Suggestions (Autocomplete Textual)
  typedApp.get(
    '/search-suggestions',
    {
      schema: {
        tags: ['Public Catalog — Marketplace'],
        summary:
          'Sugestões de busca textual e autocomplete baseado no catálogo real',
        querystring: searchSuggestionsQuerySchema,
      },
    },
    getSearchSuggestionsController,
  )
}
