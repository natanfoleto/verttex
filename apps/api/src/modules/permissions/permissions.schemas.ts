import { z } from 'zod'

export const permissionQuerySchema = z.object({
  module: z.string().optional(),
})

export type PermissionQuery = z.infer<typeof permissionQuerySchema>
