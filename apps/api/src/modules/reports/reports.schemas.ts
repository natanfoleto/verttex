import { z } from 'zod'

export const dateRangeQuerySchema = z.object({
  storeId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export const exportReportsQuerySchema = z.object({
  storeId: z.string().optional(),
  format: z.enum(['csv', 'json']).default('csv'),
})

export type DateRangeQueryInput = z.infer<typeof dateRangeQuerySchema>
export type ExportReportsQueryInput = z.infer<typeof exportReportsQuerySchema>
