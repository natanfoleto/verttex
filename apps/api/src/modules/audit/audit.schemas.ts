import { z } from 'zod'

export const auditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  userId: z.string().optional(),
  action: z.string().optional(),
  entity: z.string().optional(),
})

export type AuditQuery = z.infer<typeof auditQuerySchema>
