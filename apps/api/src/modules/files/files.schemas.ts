import { z } from "zod";

export const requestUploadBodySchema = z.object({
  fileName: z.string().min(1, "Nome do arquivo é obrigatório"),
  mimeType: z.string().min(1, "Tipo MIME é obrigatório"),
  size: z.number().positive("Tamanho do arquivo deve ser positivo"),
  purpose: z
    .enum(["product_image", "category_icon", "brand_logo", "store_logo"])
    .default("product_image"),
  storeId: z.string().optional().nullable(),
});

export type RequestUploadBody = z.infer<typeof requestUploadBodySchema>;

export const finalizeUploadParamsSchema = z.object({
  fileId: z.string().min(1, "ID do arquivo é obrigatório"),
});

export type FinalizeUploadParams = z.infer<typeof finalizeUploadParamsSchema>;
