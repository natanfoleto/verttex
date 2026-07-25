import { FastifyRequest } from "fastify";
import { prisma } from "../../infrastructure/database/prisma";
import {
  UploadService,
  DirectUploadParams,
} from "../../shared/services/upload.service";
import { FinalizeUploadParams, RequestUploadBody } from "./files.schemas";
import { logAudit } from "../../shared/utils/audit";
import { r2Storage } from "../../infrastructure/storage/r2";

export class FilesService {
  static async requestUpload(
    body: RequestUploadBody,
    userId: string,
    req?: FastifyRequest,
  ) {
    const result = await UploadService.requestUpload({
      fileName: body.fileName,
      mimeType: body.mimeType,
      size: body.size,
      purpose: body.purpose,
      storeId: body.storeId,
      userId,
    });

    await logAudit({
      userId,
      action: "REQUEST_FILE_UPLOAD",
      entity: "File",
      entityId: result.fileId,
      newValues: {
        fileName: body.fileName,
        size: body.size,
        purpose: body.purpose,
      },
      req,
    });

    return result;
  }

  static async directUpload(params: DirectUploadParams, req?: FastifyRequest) {
    const result = await UploadService.directUpload(params);

    await logAudit({
      userId: params.userId || null,
      action: "UPLOAD_FILE",
      entity: "File",
      entityId: result.id,
      newValues: {
        fileName: params.fileName,
        size: params.buffer.length,
        purpose: params.purpose,
      },
      req,
    });

    return result;
  }

  static async finalizeUpload(
    params: FinalizeUploadParams,
    userId: string,
    req?: FastifyRequest,
  ) {
    const file = await UploadService.finalizeUpload(params.fileId);

    await logAudit({
      userId,
      action: "FINALIZE_FILE_UPLOAD",
      entity: "File",
      entityId: file.id,
      newValues: { status: file.status, checksum: file.checksum },
      req,
    });

    return file;
  }

  static async getFile(fileId: string) {
    const file = await prisma.file.findFirst({
      where: {
        OR: [{ id: fileId }, { publicId: fileId }],
        deletedAt: null,
      },
    });

    if (!file) return null;

    const publicUrl = await r2Storage.getFileUrl(file.objectKey);
    return {
      ...file,
      publicUrl,
    };
  }
}
