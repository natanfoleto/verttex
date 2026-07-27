import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  getPublicProductDetailsController,
  getPublicStoreDetailsController,
  listPublicBrandsController,
  listPublicCategoriesController,
  listPublicProductsController,
  listPublicStoresController,
} from "./catalog.controller";
import {
  publicProductListQuerySchema,
  publicStoreListQuerySchema,
} from "./catalog.schemas";

export async function catalogRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  // Public Products Catalog Listing
  typedApp.get(
    "/products",
    {
      schema: {
        tags: ["Public Catalog — Marketplace"],
        summary: "Listar produtos públicos com busca, filtros (categoria, marca, preço) e estoque FEFO",
        querystring: publicProductListQuerySchema,
      },
    },
    listPublicProductsController,
  );

  // Public Product Details by Slug/ID
  typedApp.get(
    "/products/:slug",
    {
      schema: {
        tags: ["Public Catalog — Marketplace"],
        summary: "Obter detalhes públicos do produto por slug ou ID",
        params: z.object({ slug: z.string() }),
      },
    },
    getPublicProductDetailsController,
  );

  // Public Categories Hierarchy
  typedApp.get(
    "/categories",
    {
      schema: {
        tags: ["Public Catalog — Marketplace"],
        summary: "Listar categorias públicas ativas com hierarquia e contagem de produtos",
      },
    },
    listPublicCategoriesController,
  );

  // Public Brands
  typedApp.get(
    "/brands",
    {
      schema: {
        tags: ["Public Catalog — Marketplace"],
        summary: "Listar marcas públicas ativas",
      },
    },
    listPublicBrandsController,
  );

  // Public Stores Showcase
  typedApp.get(
    "/stores",
    {
      schema: {
        tags: ["Public Catalog — Marketplace"],
        summary: "Listar produtoras e lojas parceiras ativas no marketplace",
        querystring: publicStoreListQuerySchema,
      },
    },
    listPublicStoresController,
  );

  // Public Store Details by Slug
  typedApp.get(
    "/stores/:slug",
    {
      schema: {
        tags: ["Public Catalog — Marketplace"],
        summary: "Obter detalhes públicos de uma loja parceira por slug",
        params: z.object({ slug: z.string() }),
      },
    },
    getPublicStoreDetailsController,
  );
}
