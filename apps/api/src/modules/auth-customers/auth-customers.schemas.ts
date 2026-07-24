import { z } from "zod";

export const customerRegisterBodySchema = z.object({
  name: z.string().min(2, "O nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("Informe um e-mail válido"),
  phone: z.string().optional(),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

export const customerLoginBodySchema = z.object({
  email: z.string().email("Informe um e-mail válido"),
  password: z.string().min(1, "A senha é obrigatória"),
});

export const customerForgotPasswordBodySchema = z.object({
  email: z.string().email("Informe um e-mail válido"),
});

export const customerResetPasswordBodySchema = z.object({
  token: z.string().min(1, "O token é obrigatório"),
  newPassword: z
    .string()
    .min(6, "A nova senha deve ter no mínimo 6 caracteres"),
});

export const customerChangePasswordBodySchema = z.object({
  currentPassword: z.string().min(1, "A senha atual é obrigatória"),
  newPassword: z
    .string()
    .min(6, "A nova senha deve ter no mínimo 6 caracteres"),
});

export const updateCustomerProfileBodySchema = z.object({
  name: z.string().min(2, "O nome deve ter no mínimo 2 caracteres").optional(),
  phone: z.string().optional(),
});

export type CustomerRegisterBody = z.infer<typeof customerRegisterBodySchema>;
export type CustomerLoginBody = z.infer<typeof customerLoginBodySchema>;
export type CustomerForgotPasswordBody = z.infer<
  typeof customerForgotPasswordBodySchema
>;
export type CustomerResetPasswordBody = z.infer<
  typeof customerResetPasswordBodySchema
>;
export type CustomerChangePasswordBody = z.infer<
  typeof customerChangePasswordBodySchema
>;
export type UpdateCustomerProfileBody = z.infer<
  typeof updateCustomerProfileBodySchema
>;
