import { z } from "zod";

export const listNotificationsQuerySchema = z.object({
  unreadOnly: z
    .string()
    .optional()
    .transform((val) => val === "true"),
});

export const expirationCheckSchema = z.object({
  storeId: z.string().optional(),
});

export type ListNotificationsQueryInput = z.infer<typeof listNotificationsQuerySchema>;
export type ExpirationCheckInput = z.infer<typeof expirationCheckSchema>;
