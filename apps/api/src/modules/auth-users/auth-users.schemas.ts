import { z } from "zod";

export const loginBodySchema = z.object({
  email: z.string().email("Informe um e-mail válido"),
  password: z.string().min(1, "A senha é obrigatória"),
});

export const forgotPasswordBodySchema = z.object({
  email: z.string().email("Informe um e-mail válido"),
});

export const resetPasswordBodySchema = z.object({
  token: z.string().min(1, "O token é obrigatório"),
  newPassword: z
    .string()
    .min(6, "A nova senha deve ter no mínimo 6 caracteres"),
});

export const changePasswordBodySchema = z.object({
  currentPassword: z.string().min(1, "A senha atual é obrigatória"),
  newPassword: z
    .string()
    .min(6, "A nova senha deve ter no mínimo 6 caracteres"),
});

export const userProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  status: z.string(),
  role: z.object({
    id: z.string(),
    key: z.string(),
    name: z.string(),
  }),
  permissions: z.array(
    z.object({
      key: z.string(),
      effect: z.enum(["allow", "deny"]),
      origin: z.enum(["role", "override"]),
    }),
  ),
  stores: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
      isOwner: z.boolean(),
    }),
  ),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type LoginBody = z.infer<typeof loginBodySchema>;
export type ForgotPasswordBody = z.infer<typeof forgotPasswordBodySchema>;
export type ResetPasswordBody = z.infer<typeof resetPasswordBodySchema>;
export type ChangePasswordBody = z.infer<typeof changePasswordBodySchema>;
