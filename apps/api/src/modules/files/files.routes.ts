import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { requirePermission } from "../../shared/middlewares/require-permission";
import {
  finalizeUploadController,
  getFileController,
  requestUploadController,
} from "./files.controller";
import {
  finalizeUploadParamsSchema,
  requestUploadBodySchema,
} from "./files.schemas";

export async function filesRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.post(
    "/presigned-url",
    {
      preHandler: [app.authenticateUser, requirePermission("create", "File")],
      schema: {
        tags: ["Files — Media Management"],
        summary: "Solicitar URL pré-assinada para upload direto de arquivo",
        security: [{ bearerAuth: [] }],
        body: requestUploadBodySchema,
      },
    },
    requestUploadController,
  );

  typedApp.post(
    "/:fileId/finalize",
    {
      preHandler: [app.authenticateUser, requirePermission("create", "File")],
      schema: {
        tags: ["Files — Media Management"],
        summary: "Finalizar e aprovar upload de arquivo server-side",
        security: [{ bearerAuth: [] }],
        params: finalizeUploadParamsSchema,
      },
    },
    finalizeUploadController,
  );

  typedApp.get(
    "/:fileId",
    {
      preHandler: [app.authenticateUser, requirePermission("read", "File")],
      schema: {
        tags: ["Files — Media Management"],
        summary: "Obter metadados do arquivo",
        security: [{ bearerAuth: [] }],
        params: z.object({ fileId: z.string() }),
      },
    },
    getFileController,
  );
}
