import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  createReviewController,
  listProductReviewsController,
  createQuestionController,
  answerQuestionController,
  moderateReviewController,
} from "./reviews.controller";
import {
  createReviewSchema,
  createQuestionSchema,
  answerQuestionSchema,
  moderateReviewSchema,
} from "./reviews.schemas";

export async function reviewsRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  // POST /reviews — Protected for Customers (Verified Purchase)
  typedApp.post(
    "/",
    {
      preHandler: [app.authenticateCustomer],
      schema: {
        tags: ["Reviews & Q&A"],
        summary: "Criar avaliação de produto (somente compras verificadas)",
        security: [{ bearerAuth: [] }],
        body: createReviewSchema,
      },
    },
    createReviewController,
  );

  // GET /reviews/product/:productId — Public listing
  typedApp.get(
    "/product/:productId",
    {
      schema: {
        tags: ["Reviews & Q&A"],
        summary: "Listar avaliações e média de estrelas de um produto",
        params: z.object({ productId: z.string() }),
      },
    },
    listProductReviewsController,
  );

  // POST /reviews/questions — Protected for Customers
  typedApp.post(
    "/questions",
    {
      preHandler: [app.authenticateCustomer],
      schema: {
        tags: ["Reviews & Q&A"],
        summary: "Fazer uma pergunta sobre um produto",
        security: [{ bearerAuth: [] }],
        body: createQuestionSchema,
      },
    },
    createQuestionController,
  );

  // POST /reviews/questions/:questionId/answer — Protected for Management Users
  typedApp.post(
    "/questions/:questionId/answer",
    {
      preHandler: [app.authenticateUser],
      schema: {
        tags: ["Reviews & Q&A"],
        summary: "Responder pergunta de um produto (Lojista)",
        security: [{ bearerAuth: [] }],
        params: z.object({ questionId: z.string() }),
        body: answerQuestionSchema,
      },
    },
    answerQuestionController,
  );

  // PATCH /reviews/:reviewId/moderate — Protected for Management Users
  typedApp.patch(
    "/:reviewId/moderate",
    {
      preHandler: [app.authenticateUser],
      schema: {
        tags: ["Reviews & Q&A"],
        summary: "Moderar/Ocultar avaliação de produto (Manager)",
        security: [{ bearerAuth: [] }],
        params: z.object({ reviewId: z.string() }),
        body: moderateReviewSchema,
      },
    },
    moderateReviewController,
  );
}
