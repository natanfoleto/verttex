import { z } from 'zod'

export const actionSchema = z.union([
  z.literal('manage'),
  z.literal('read'),
  z.literal('create'),
  z.literal('update'),
  z.literal('delete'),
  z.literal('manage-members'),
])

export type Action = z.infer<typeof actionSchema>

export const subjectSchema = z.union([
  z.literal('User'),
  z.literal('Role'),
  z.literal('Permission'),
  z.literal('Store'),
  z.literal('Customer'),
  z.literal('Product'),
  z.literal('Inventory'),
  z.literal('Sale'),
  z.literal('Report'),
  z.literal('all'),
])

export type Subject = z.infer<typeof subjectSchema>

export const appAbilitiesSchema = z.union([
  z.tuple([actionSchema, subjectSchema]),
  z.tuple([z.literal('manage'), z.literal('all')]),
])

export type AppAbilities = z.infer<typeof appAbilitiesSchema>
