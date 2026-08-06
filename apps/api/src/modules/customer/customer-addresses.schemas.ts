import { z } from 'zod'

import { validateCPForCNPJ } from '../../shared/utils/cpf-cnpj'

export const createAddressBodySchema = z
  .object({
    label: z.string().optional(),
    recipient: z
      .string()
      .min(2, 'Nome do destinatário deve ter no mínimo 2 caracteres'),
    phone: z.string().optional(),
    zipCode: z
      .string()
      .transform((val) => val.replace(/\D/g, ''))
      .refine((val) => val.length === 8, 'CEP inválido'),
    street: z.string().min(2, 'Rua/Logradouro é obrigatório'),
    number: z.string().min(1, 'Número é obrigatório'),
    complement: z.string().optional(),
    neighborhood: z.string().min(1, 'Bairro é obrigatório'),
    city: z.string().min(2, 'Cidade é obrigatória'),
    state: z
      .string()
      .length(2, 'Estado/UF deve conter 2 letras (ex: RS)')
      .transform((val) => val.toUpperCase()),
    isDefault: z.boolean().optional().default(false),
  })
  .strict()

export type CreateAddressBody = z.infer<typeof createAddressBodySchema>

export const updateAddressBodySchema = createAddressBodySchema.partial()
export type UpdateAddressBody = z.infer<typeof updateAddressBodySchema>

export const updateCustomerProfileBodySchema = z
  .object({
    name: z
      .string()
      .min(2, 'Nome deve conter no mínimo 2 caracteres')
      .optional(),
    phone: z.string().optional(),
    cpfCnpj: z
      .string()
      .transform((val) => val.replace(/\D/g, ''))
      .refine((val) => !val || validateCPForCNPJ(val), 'CPF ou CNPJ inválido')
      .optional(),
    birthDate: z.coerce.date().optional(),
  })
  .strict()

export type UpdateCustomerProfileBody = z.infer<
  typeof updateCustomerProfileBodySchema
>
