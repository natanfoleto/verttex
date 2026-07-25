import { z } from "zod";

export const receiveBatchItemSchema = z.object({
  lotNumber: z.string().min(1, "Código do lote é obrigatório"),
  manufacturer: z.string().optional().nullable(),
  supplier: z.string().optional().nullable(),
  manufacturingDate: z.string().datetime().optional().nullable(),
  expirationDate: z.string().datetime().optional().nullable(),
  quantity: z.number().int().positive("Quantidade deve ser maior que zero"),
  notes: z.string().optional().nullable(),
});

export const receiveStockBodySchema = z.object({
  storeId: z.string().min(1, "Loja é obrigatória"),
  variationId: z.string().min(1, "Variação do produto é obrigatória"),
  locationName: z.string().optional().default("Depósito Principal"),
  locationId: z.string().optional(),
  documentReference: z.string().optional().nullable(), // NFe, Guia de Entrada
  lots: z
    .array(receiveBatchItemSchema)
    .min(1, "Deve conter pelo menos 1 lote no recebimento"),
});

export type ReceiveStockBody = z.infer<typeof receiveStockBodySchema>;

export const adjustStockBodySchema = z.object({
  storeId: z.string().min(1, "Loja é obrigatória"),
  variationId: z.string().min(1, "Variação do produto é obrigatória"),
  lotId: z.string().optional().nullable(),
  locationId: z.string().min(1, "Localização é obrigatória"),
  newPhysicalQuantity: z
    .number()
    .int()
    .min(0, "Quantidade não pode ser negativa"),
  reason: z.string().min(3, "Motivo do ajuste é obrigatório"),
});

export type AdjustStockBody = z.infer<typeof adjustStockBodySchema>;

export const discardExpiredStockBodySchema = z.object({
  storeId: z.string().min(1, "Loja é obrigatória"),
  lotId: z.string().min(1, "Lote é obrigatório"),
  locationId: z.string().min(1, "Localização é obrigatória"),
  quantity: z
    .number()
    .int()
    .positive("Quantidade a descartar deve ser maior que zero"),
  reason: z.enum(["expired", "damaged", "recalled", "other"]),
  destination: z
    .string()
    .min(3, "Destino ou empresa responsável pelo descarte é obrigatório"),
  notes: z.string().optional().nullable(),
});

export type DiscardExpiredStockBody = z.infer<
  typeof discardExpiredStockBodySchema
>;

export const transferStockBodySchema = z.object({
  storeId: z.string().min(1, "Loja é obrigatória"),
  variationId: z.string().min(1, "Variação é obrigatória"),
  lotId: z.string().optional().nullable(),
  sourceLocationId: z.string().min(1, "Localização de origem é obrigatória"),
  targetLocationId: z.string().min(1, "Localização de destino é obrigatória"),
  quantity: z
    .number()
    .int()
    .positive("Quantidade a transferir deve ser maior que zero"),
  reason: z.string().optional().nullable(),
});

export type TransferStockBody = z.infer<typeof transferStockBodySchema>;

export const queryAvailabilityQuerySchema = z.object({
  storeId: z.string().min(1, "Loja é obrigatória"),
  variationId: z.string().min(1, "Variação é obrigatória"),
  estimatedDeliveryDate: z.string().datetime().optional(),
  requestedQuantity: z
    .string()
    .transform((v) => parseInt(v, 10))
    .optional()
    .default("1"),
});

export type QueryAvailabilityQuery = z.infer<
  typeof queryAvailabilityQuerySchema
>;
