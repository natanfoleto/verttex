import { z } from 'zod'

export const roleParamsSchema = z.object({
  roleId: z.string(),
})

export const roleQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  perPage: z.coerce.number().optional().default(20),
  search: z.string().optional(),
})

export type RoleQuery = z.infer<typeof roleQuerySchema>

export const createRoleBodySchema = z.object({
  key: z.string().min(2, 'A chave deve ter no mínimo 2 caracteres'),
  name: z.string().min(2, 'O nome deve ter no mínimo 2 caracteres'),
  description: z.string().optional(),
})

export const updateRoleBodySchema = z.object({
  name: z.string().min(2, 'O nome deve ter no mínimo 2 caracteres').optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

export const updateRolePermissionsBodySchema = z.object({
  permissionIds: z.array(z.string()),
  strategy: z.enum(['ALL', 'PRESERVE_ALL', 'CUSTOM']).optional().default('ALL'),
  targetUserIds: z.array(z.string()).optional(),
})

export type RoleParams = z.infer<typeof roleParamsSchema>
export type CreateRoleBody = z.infer<typeof createRoleBodySchema>
export type UpdateRoleBody = z.infer<typeof updateRoleBodySchema>
export type UpdateRolePermissionsBody = z.infer<
  typeof updateRolePermissionsBodySchema
>
