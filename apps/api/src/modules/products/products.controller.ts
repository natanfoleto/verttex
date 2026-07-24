import { FastifyReply } from "fastify";
import { FastifyZodRequest } from "../../@types/fastify";
import { AppError } from "../../shared/errors/app-error";
import {
  CreateProductBody,
  ProductListQuery,
  UpdateProductBody,
} from "./products.schemas";
import { ProductsService } from "./products.service";

export async function listProductsController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const query = request.query as ProductListQuery;
  const result = await ProductsService.listProducts(query);
  return reply.send({
    success: true,
    ...result,
  });
}

export async function getProductController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const params = request.params as { id: string };
  const product = await ProductsService.getProduct(params.id);
  return reply.send({
    success: true,
    data: product,
  });
}

export async function createProductController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const userId = request.userPayload?.id;
  if (!userId) {
    throw new AppError("UNAUTHORIZED", "Usuário não autenticado", 401);
  }

  const body = request.body as CreateProductBody;
  const product = await ProductsService.createProduct(body, userId, request);

  return reply.status(201).send({
    success: true,
    data: product,
  });
}

export async function updateProductController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const userId = request.userPayload?.id;
  if (!userId) {
    throw new AppError("UNAUTHORIZED", "Usuário não autenticado", 401);
  }

  const params = request.params as { id: string };
  const body = request.body as UpdateProductBody;
  const product = await ProductsService.updateProduct(
    params.id,
    body,
    userId,
    request,
  );

  return reply.send({
    success: true,
    data: product,
  });
}

export async function publishProductController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const userId = request.userPayload?.id;
  if (!userId) {
    throw new AppError("UNAUTHORIZED", "Usuário não autenticado", 401);
  }

  const params = request.params as { id: string };
  const product = await ProductsService.publishProduct(
    params.id,
    userId,
    request,
  );

  return reply.send({
    success: true,
    data: product,
  });
}

export async function archiveProductController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const userId = request.userPayload?.id;
  if (!userId) {
    throw new AppError("UNAUTHORIZED", "Usuário não autenticado", 401);
  }

  const params = request.params as { id: string };
  const result = await ProductsService.archiveProduct(
    params.id,
    userId,
    request,
  );

  return reply.send({
    success: true,
    data: result,
  });
}
