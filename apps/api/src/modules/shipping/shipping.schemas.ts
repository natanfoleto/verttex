import { z } from "zod";

export const quoteShippingSchema = z.object({
  zipCode: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length === 8, "CEP deve conter exatamente 8 dígitos"),
  items: z.array(
    z.object({
      variationId: z.string().min(1),
      quantity: z.number().int().positive(),
    }),
  ),
});

export const dispatchOrderSchema = z.object({
  trackingCode: z.string().min(1, "Código de rastreamento é obrigatório"),
  carrierName: z.string().min(1, "Nome da transportadora é obrigatório"),
  notes: z.string().optional(),
});

export const updateTrackingSchema = z.object({
  trackingCode: z.string().optional(),
  statusUpdate: z.string().min(1, "Status de rastreamento é obrigatório"),
  location: z.string().optional(),
});

export type QuoteShippingInput = z.infer<typeof quoteShippingSchema>;
export type DispatchOrderInput = z.infer<typeof dispatchOrderSchema>;
export type UpdateTrackingInput = z.infer<typeof updateTrackingSchema>;
