import { z } from "zod";

export const storeParamsSchema = z.object({
  storeId: z.string(),
});

export const storeQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  perPage: z.coerce.number().optional().default(20),
  search: z.string().optional(),
  status: z.enum(["draft", "active", "inactive", "suspended"]).optional(),
});

export const createStoreBodySchema = z.object({
  name: z.string().min(2, "O nome da loja deve ter no mínimo 2 caracteres"),
  slug: z.string().min(2, "O slug deve ter no mínimo 2 caracteres"),
  description: z.string().optional(),
  logoUrl: z.string().url("URL do logo inválida").optional().or(z.literal("")),
  coverUrl: z.string().url("URL da capa inválida").optional().or(z.literal("")),
  customDomain: z.string().optional().or(z.literal("")),
});

export const updateStoreBodySchema = z.object({
  name: z.string().min(2, "O nome da loja deve ter no mínimo 2 caracteres").optional(),
  slug: z.string().min(2, "O slug deve ter no mínimo 2 caracteres").optional(),
  description: z.string().optional(),
  logoUrl: z.string().url("URL do logo inválida").optional().or(z.literal("")),
  coverUrl: z.string().url("URL da capa inválida").optional().or(z.literal("")),
  customDomain: z.string().optional().or(z.literal("")),
  status: z.enum(["draft", "active", "inactive", "suspended"]).optional(),
});

export const addStoreMemberBodySchema = z.object({
  userId: z.string().min(1, "ID do usuário é obrigatório"),
  isOwner: z.boolean().optional().default(false),
});

export const storeMemberParamsSchema = z.object({
  storeId: z.string(),
  userId: z.string(),
});

export type StoreParams = z.infer<typeof storeParamsSchema>;
export type StoreQuery = z.infer<typeof storeQuerySchema>;
export type CreateStoreBody = z.infer<typeof createStoreBodySchema>;
export type UpdateStoreBody = z.infer<typeof updateStoreBodySchema>;
export type AddStoreMemberBody = z.infer<typeof addStoreMemberBodySchema>;
export type StoreMemberParams = z.infer<typeof storeMemberParamsSchema>;
