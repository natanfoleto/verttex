import { FastifyReply, FastifyRequest } from "fastify";
import { FastifyZodRequest } from "../../@types/fastify";
import { categoriesService } from "./categories.service";
import {
  CategoryQuery,
  CreateCategoryBody,
  UpdateCategoryBody,
  ReorderCategoriesBody,
} from "./categories.schemas";

export class CategoriesController {
  async list(
    req: FastifyRequest<{ Querystring: CategoryQuery }>,
    reply: FastifyReply,
  ) {
    const result = await categoriesService.listCategories(req.query);
    return reply.send({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  }

  async getTree(_req: FastifyRequest, reply: FastifyReply) {
    const tree = await categoriesService.getCategoryTree();
    return reply.send({
      success: true,
      data: tree,
    });
  }

  async getById(
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const category = await categoriesService.getCategoryById(req.params.id);
    return reply.send({
      success: true,
      data: category,
    });
  }

  async create(req: FastifyZodRequest, reply: FastifyReply) {
    const body = req.body as CreateCategoryBody;
    const category = await categoriesService.createCategory(
      body,
      req.userPayload?.id,
      req,
    );
    return reply.status(201).send({
      success: true,
      data: category,
    });
  }

  async update(req: FastifyZodRequest, reply: FastifyReply) {
    const params = req.params as { id: string };
    const body = req.body as UpdateCategoryBody;
    const category = await categoriesService.updateCategory(
      params.id,
      body,
      req.userPayload?.id,
      req,
    );
    return reply.send({
      success: true,
      data: category,
    });
  }

  async delete(req: FastifyZodRequest, reply: FastifyReply) {
    const params = req.params as { id: string };
    const result = await categoriesService.deleteCategory(
      params.id,
      req.userPayload?.id,
      req,
    );
    return reply.send({
      success: true,
      data: result,
    });
  }

  async reorder(req: FastifyZodRequest, reply: FastifyReply) {
    const body = req.body as ReorderCategoriesBody;
    const result = await categoriesService.reorderCategories(
      body,
      req.userPayload?.id,
      req,
    );
    return reply.send({
      success: true,
      data: result,
    });
  }
}

export const categoriesController = new CategoriesController();
