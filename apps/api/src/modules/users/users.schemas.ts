import { z } from "zod";

export const userParamsSchema = z.object({
  userId: z.string(),
});

export const userQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  perPage: z.coerce.number().optional().default(20),
  search: z.string().optional(),
  roleId: z.string().optional(),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
});

export const createUserBodySchema = z.object({
  name: z.string().min(2, "O nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("Informe um e-mail válido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  roleId: z.string().min(1, "O cargo é obrigatório"),
  phone: z.string().optional(),
});

export const updateUserBodySchema = z.object({
  name: z.string().min(2, "O nome deve ter no mínimo 2 caracteres").optional(),
  email: z.string().email("Informe um e-mail válido").optional(),
  phone: z.string().optional(),
  roleId: z.string().optional(),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
});

export const updateUserPermissionsBodySchema = z.object({
  overrides: z.array(
    z.object({
      permissionId: z.string(),
      effect: z.enum(["allow", "deny"]),
    }),
  ),
});

export type UserParams = z.infer<typeof userParamsSchema>;
export type UserQuery = z.infer<typeof userQuerySchema>;
export type CreateUserBody = z.infer<typeof createUserBodySchema>;
export type UpdateUserBody = z.infer<typeof updateUserBodySchema>;
export type UpdateUserPermissionsBody = z.infer<
  typeof updateUserPermissionsBodySchema
>;
