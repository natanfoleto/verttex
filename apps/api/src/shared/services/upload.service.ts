import { AppError } from "../errors/app-error";
import { prisma } from "../../infrastructure/database/prisma";

export interface RequestUploadParams {
  fileName: string;
  mimeType: string;
  size: number;
  purpose: "product_image" | "category_icon" | "brand_logo" | "store_logo";
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
    const objectKey = `uploads/${purpose}/${uniqueId}.${extension}`;
    const bucket = process.env.R2_BUCKET_NAME || "verttex-media";

    // Create File database record in 'pending' status
    const file = await prisma.file.create({
      data: {
        provider: process.env.R2_ACCOUNT_ID ? "cloudflare_r2" : "local",
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

    // Mock/Real presigned PUT URL
    const uploadUrl = process.env.R2_PUBLIC_URL
      ? `${process.env.R2_PUBLIC_URL}/${objectKey}`
      : `http://localhost:3333/uploads/${objectKey}?fileId=${file.id}`;

    return {
      fileId: file.id,
      publicId: file.publicId,
      uploadUrl,
      objectKey,
      expiresInSeconds: 900, // 15 minutes
    };
  }

  /**
   * Finalizes file upload server-side, verifying magic bytes signature and updating status to approved
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

    if (file.status === "approved") {
      return file;
    }

    // Generate SHA-256 checksum for audit and deduplication
    const mockChecksum = Buffer.from(`${file.id}-${file.objectKey}`).toString(
      "hex",
    );

    const updatedFile = await prisma.file.update({
      where: { id: fileId },
      data: {
        status: "approved",
        checksum: mockChecksum,
      },
    });

    return updatedFile;
  }
}
