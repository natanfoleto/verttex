import { z } from "zod";

export const createPaymentChargeSchema = z.object({
  orderId: z.string().min(1, "ID do pedido é obrigatório"),
  paymentMethod: z.enum(["pix", "credit_card", "boleto"]).default("pix"),
});

export const webhookEventSchema = z.object({
  eventId: z.string().min(1, "eventId é obrigatório"),
  eventType: z.enum([
    "PAYMENT_APPROVED",
    "PAYMENT_FAILED",
    "PAYMENT_EXPIRED",
    "PAYMENT_REFUNDED",
  ]),
  orderId: z.string().min(1, "orderId é obrigatório"),
  amount: z.number().positive().optional(),
  transactionId: z.string().optional(),
  signature: z.string().optional(),
});

export type CreatePaymentChargeInput = z.infer<typeof createPaymentChargeSchema>;
export type WebhookEventInput = z.infer<typeof webhookEventSchema>;
