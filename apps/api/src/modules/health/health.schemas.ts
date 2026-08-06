import { createApiSuccessSchema } from '@verttex/types'
import { z } from 'zod'

export const healthResponseSchema = createApiSuccessSchema(
  z.object({
    status: z.string(),
    timestamp: z.string(),
  }),
)

export type HealthResponse = z.infer<typeof healthResponseSchema>
