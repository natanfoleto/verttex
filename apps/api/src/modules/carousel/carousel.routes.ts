import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { requirePermission } from "../../shared/middlewares/require-permission";
import { carouselController } from "./carousel.controller";
import {
  createCarouselBannerSchema,
  reorderCarouselBannersSchema,
  updateCarouselBannerSchema,
} from "./carousel.schemas";

const idParamsSchema = z.object({ id: z.string().min(1) });

export async function carouselRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  // Listar banners (Admin)
  typedApp.get(
    "/",
    {
      preHandler: [
        app.authenticateUser,
        requirePermission("read", "Marketplace"),
      ],
    },
    carouselController.listBanners
  );

  // Criar banner (sem imagem inicial)
  typedApp.post(
    "/",
    {
      preHandler: [
        app.authenticateUser,
        requirePermission("create", "Marketplace"),
      ],
      schema: { body: createCarouselBannerSchema },
    },
    carouselController.createBanner
  );

  // Consultar banner por ID
  typedApp.get(
    "/:id",
    {
      preHandler: [
        app.authenticateUser,
        requirePermission("read", "Marketplace"),
      ],
      schema: { params: idParamsSchema },
    },
    carouselController.getBanner
  );

  // Atualizar dados/imagem do banner
  typedApp.patch(
    "/:id",
    {
      preHandler: [
        app.authenticateUser,
        requirePermission("update", "Marketplace"),
      ],
      schema: { params: idParamsSchema, body: updateCarouselBannerSchema },
    },
    carouselController.updateBanner
  );

  // Excluir somente a imagem do banner
  typedApp.delete(
    "/:id/image",
    {
      preHandler: [
        app.authenticateUser,
        requirePermission("update", "Marketplace"),
      ],
      schema: { params: idParamsSchema },
    },
    carouselController.deleteBannerImage
  );

  // Excluir banner permanentemente (e sua imagem no R2)
  typedApp.delete(
    "/:id",
    {
      preHandler: [
        app.authenticateUser,
        requirePermission("delete", "Marketplace"),
      ],
      schema: { params: idParamsSchema },
    },
    carouselController.deleteBanner
  );

  // Reordenar banners
  typedApp.post(
    "/reorder",
    {
      preHandler: [
        app.authenticateUser,
        requirePermission("update", "Marketplace"),
      ],
      schema: { body: reorderCarouselBannersSchema },
    },
    carouselController.reorderBanners
  );
}

export async function carouselPublicRoutes(app: FastifyInstance) {
  // Rota pública do Marketplace (retorna somente banners ativos com imagem válida ordenados por posição)
  app.get("/", carouselController.listActiveBanners);
}
