import { FastifyReply, FastifyRequest } from "fastify";
import { PublicCatalogService } from "./catalog.service";
import { PublicProductListQuery, PublicStoreListQuery } from "./catalog.schemas";

export async function listPublicProductsController(
  req: FastifyRequest<{ Querystring: PublicProductListQuery }>,
  reply: FastifyReply,
) {
  const result = await PublicCatalogService.listPublicProducts(req.query);
  return reply.status(200).send({
    success: true,
    data: result.data,
    meta: result.meta,
  });
}

export async function getPublicProductDetailsController(
  req: FastifyRequest<{ Params: { slug: string } }>,
  reply: FastifyReply,
) {
  const product = await PublicCatalogService.getPublicProductDetails(req.params.slug);
  return reply.status(200).send({
    success: true,
    data: product,
  });
}

export async function listPublicCategoriesController(
  _req: FastifyRequest,
  reply: FastifyReply,
) {
  const categories = await PublicCatalogService.listPublicCategories();
  return reply.status(200).send({
    success: true,
    data: categories,
  });
}

export async function listPublicBrandsController(
  _req: FastifyRequest,
  reply: FastifyReply,
) {
  const brands = await PublicCatalogService.listPublicBrands();
  return reply.status(200).send({
    success: true,
    data: brands,
  });
}

export async function listPublicStoresController(
  req: FastifyRequest<{ Querystring: PublicStoreListQuery }>,
  reply: FastifyReply,
) {
  const result = await PublicCatalogService.listPublicStores(req.query);
  return reply.status(200).send({
    success: true,
    data: result.data,
    meta: result.meta,
  });
}

export async function getPublicStoreDetailsController(
  req: FastifyRequest<{ Params: { slug: string } }>,
  reply: FastifyReply,
) {
  const store = await PublicCatalogService.getPublicStoreDetails(req.params.slug);
  return reply.status(200).send({
    success: true,
    data: store,
  });
}
