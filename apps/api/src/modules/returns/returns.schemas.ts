import { z } from "zod";

export const requestReturnSchema = z.object({
  orderId: z.string().min(1, "ID do pedido é obrigatório"),
  reason: z.string().min(5, "Motivo da devolução é obrigatório (mínimo 5 caracteres)"),
  items: z.array(
    z.object({
      orderItemId: z.string().min(1),
      quantity: z.number().int().positive(),
    }),
  ).min(1, "Deve incluir ao menos 1 item para devolução"),
});

export const quarantineEntrySchema = z.object({
  notes: z.string().optional(),
});

export const quarantineReleaseSchema = z.object({
  decision: z.enum(["APPROVED_FOR_SALE", "DISCARD_DAMAGE", "DISCARD_EXPIRATION"]),
  notes: z.string().min(3, "Laudo de inspeção sanitária é obrigatório"),
});

export const processRefundSchema = z.object({
  amount: z.number().positive("Valor de reembolso deve ser positivo"),
  reason: z.string().optional(),
});

export type RequestReturnInput = z.infer<typeof requestReturnSchema>;
export type QuarantineEntryInput = z.infer<typeof quarantineEntrySchema>;
export type QuarantineReleaseInput = z.infer<typeof quarantineReleaseSchema>;
export type ProcessRefundInput = z.infer<typeof processRefundSchema>;
