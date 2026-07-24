import { FastifyReply } from "fastify";
import { FastifyZodRequest } from "../../@types/fastify";
import { AppError } from "../../shared/errors/app-error";
import { FilesService } from "./files.service";
import { FinalizeUploadParams, RequestUploadBody } from "./files.schemas";

export async function requestUploadController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const userId = request.userPayload?.id;
  if (!userId) {
    throw new AppError("UNAUTHORIZED", "Usuário não autenticado", 401);
  }

  const body = request.body as RequestUploadBody;
  const result = await FilesService.requestUpload(body, userId, request);

  return reply.status(201).send({
    success: true,
    data: result,
  });
}

export async function directUploadController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const userId = request.userPayload?.id;
  if (!userId) {
    throw new AppError("UNAUTHORIZED", "Usuário não autenticado", 401);
  }

  const data = await request.file();
  if (!data) {
    throw new AppError("VALIDATION_ERROR", "Nenhum arquivo enviado", 400);
  }

  const buffer = await data.toBuffer();
  const fields = data.fields as Record<string, any>;
  const rawPurpose = fields.purpose?.value || "product_image";
  const storeId = fields.storeId?.value || null;

  const validPurposes = [
    "product_image",
    "category_icon",
    "brand_logo",
    "store_logo",
  ] as const;

  const purpose = validPurposes.includes(rawPurpose)
    ? rawPurpose
    : "product_image";

  const result = await FilesService.directUpload(
    {
      fileName: data.filename,
      mimeType: data.mimetype,
      buffer,
      purpose,
      storeId,
      userId,
    },
    request,
  );

  return reply.status(201).send({
    success: true,
    data: result,
  });
}

export async function finalizeUploadController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const userId = request.userPayload?.id;
  if (!userId) {
    throw new AppError("UNAUTHORIZED", "Usuário não autenticado", 401);
  }

  const params = request.params as FinalizeUploadParams;
  const result = await FilesService.finalizeUpload(params, userId, request);

  return reply.send({
    success: true,
    data: result,
  });
}

export async function getFileController(
  request: FastifyZodRequest,
  reply: FastifyReply,
) {
  const params = request.params as { fileId: string };
  const file = await FilesService.getFile(params.fileId);
  if (!file) {
    throw new AppError("NOT_FOUND", "Arquivo não encontrado", 404);
  }

  return reply.send({
    success: true,
    data: file,
  });
}
