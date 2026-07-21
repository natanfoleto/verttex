import { z } from 'zod'

export const RoleSchema = z.union([
  z.literal('admin'),
  z.literal('employee'),
  z.literal('supplier'),
])

export type Role = z.infer<typeof RoleSchema>

export const ROLES = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
  SUPPLIER: 'supplier',
} as const
