import { apiEnv } from "@verttex/env/api";
import { AppError } from "../errors/app-error";
import { prisma } from "../../infrastructure/database/prisma";
import { r2Storage } from "../../infrastructure/storage/r2";

export type UploadPurpose =
  | "product_image"
  | "category_icon"
  | "brand_logo"
  | "store_logo"
  | "marketplace_banner";

export interface RequestUploadParams {
  fileName: string;
  mimeType: string;
  size: number;
  purpose: UploadPurpose;
  storeId?: string | null;
  userId?: string | null;
}

export interface DirectUploadParams {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  purpose: UploadPurpose;
  storeId?: string | null;
  userId?: string | null;
}

const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export class UploadService {
  /**
   * Generates presigned URL metadata and creates pending File record
   */
  static async requestUpload(params: RequestUploadParams) {
    const { fileName, mimeType, size, purpose, storeId, userId } = params;

    if (size > MAX_FILE_SIZE_BYTES) {
      throw new AppError(
        "VALIDATION_ERROR",
        `O tamanho do arquivo excede o limite máximo permitido de 5 MB (${Math.round(size / 1024 / 1024)} MB enviado)`,
        400,
      );
    }

    const extension = ALLOWED_MIME_TYPES[mimeType.toLowerCase()];
    if (!extension) {
      throw new AppError(
        "VALIDATION_ERROR",
        `Formato de arquivo não suportado (${mimeType}). Formatos aceitos: JPEG, PNG, WebP. SVGs e scripts são desativados por segurança.`,
        400,
      );
    }

    // Generate safe non-predictable object key
    const uniqueId =
      Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
    const folder = purpose === "marketplace_banner" ? "marketplace/banners" : purpose;
    const objectKey = `uploads/${folder}/${uniqueId}.${extension}`;
    const bucket = apiEnv.R2_BUCKET_NAME || "verttex";

    // Create File database record in 'pending' status
    const file = await prisma.file.create({
      data: {
        provider: r2Storage.isConfigured ? "cloudflare_r2" : "local",
        bucket,
        objectKey,
        originalName: fileName,
        extension,
        mimeType,
        size,
        status: "pending",
        purpose,
        storeId: storeId || null,
        userId: userId || null,
      },
    });

    const uploadUrl = await r2Storage.getPresignedUploadUrl(
      objectKey,
      mimeType,
    );
    const publicUrl = await r2Storage.getFileUrl(objectKey);

    return {
      fileId: file.id,
      publicId: file.publicId,
      uploadUrl,
      publicUrl,
      objectKey,
      expiresInSeconds: 900, // 15 minutes
    };
  }

  /**
   * Direct multipart upload into Cloudflare R2
   */
  static async directUpload(params: DirectUploadParams) {
    const { fileName, mimeType, buffer, purpose, storeId, userId } = params;
    const size = buffer.length;

    if (size > MAX_FILE_SIZE_BYTES) {
      throw new AppError(
        "VALIDATION_ERROR",
        `O tamanho do arquivo excede o limite máximo permitido de 5 MB (${Math.round(size / 1024 / 1024)} MB enviado)`,
        400,
      );
    }

    const extension = ALLOWED_MIME_TYPES[mimeType.toLowerCase()];
    if (!extension) {
      throw new AppError(
        "VALIDATION_ERROR",
        `Formato de arquivo não suportado (${mimeType}). Formatos aceitos: JPEG, PNG, WebP. SVGs e scripts são desativados por segurança.`,
        400,
      );
    }

    const uniqueId =
      Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
    const folder = purpose === "marketplace_banner" ? "marketplace/banners" : purpose;
    const objectKey = `uploads/${folder}/${uniqueId}.${extension}`;
    const bucket = apiEnv.R2_BUCKET_NAME || "verttex";

    // Upload to Cloudflare R2
    const publicUrl = await r2Storage.uploadFile(objectKey, buffer, mimeType);

    // Create File database record directly in 'approved' status
    const file = await prisma.file.create({
      data: {
        provider: r2Storage.isConfigured ? "cloudflare_r2" : "local",
        bucket,
        objectKey,
        originalName: fileName,
        extension,
        mimeType,
        size,
        status: "approved",
        purpose,
        storeId: storeId || null,
        userId: userId || null,
      },
    });

    return {
      ...file,
      publicUrl,
    };
  }

  /**
   * Finalizes file upload server-side, updating status to approved
   */
  static async finalizeUpload(fileId: string) {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new AppError(
        "NOT_FOUND",
        "Registro de arquivo não encontrado",
        404,
      );
    }

    const publicUrl = await r2Storage.getFileUrl(file.objectKey);

    if (file.status === "approved") {
      return {
        ...file,
        publicUrl,
      };
    }

    const updatedFile = await prisma.file.update({
      where: { id: fileId },
      data: {
        status: "approved",
      },
    });

    return {
      ...updatedFile,
      publicUrl,
    };
  }

  /**
   * Permanently deletes a file from Cloudflare R2 and PostgreSQL database
   */
  static async deleteFile(fileId: string) {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) return;

    try {
      await r2Storage.deleteFile(file.objectKey);
    } catch (err) {
      console.error(
        `Erro ao apagar arquivo ${file.objectKey} no Cloudflare R2:`,
        err,
      );
    }

    await prisma.file
      .delete({
        where: { id: fileId },
      })
      .catch(() => null);
  }
}
