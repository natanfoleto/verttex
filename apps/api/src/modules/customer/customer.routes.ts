import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { getCustomerProfileController } from '../auth-customers/auth-customers.controller'
import {
  createAddressController,
  deleteAddressController,
  getAddressDetailsController,
  listAddressesController,
  lookupCepController,
  mergeAnonymousSessionController,
  setDefaultAddressController,
  updateAddressController,
  updateCustomerProfileExtendedController,
} from './customer.controller'
import {
  createAddressBodySchema,
  updateAddressBodySchema,
  updateCustomerProfileBodySchema,
} from './customer-addresses.schemas'

export async function customerRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>()

  // Anonymous Session Merge Endpoint
  typedApp.post(
    '/merge-anonymous-session',
    {
      preHandler: [app.authenticateCustomer],
      schema: {
        tags: ['Customer Personalization'],
        summary:
          'Mesclar carrinho e perfil anônimo na conta do cliente autenticado',
        security: [{ bearerAuth: [] }],
        response: {
          200: z.object({
            success: z.literal(true),
            data: z.object({
              success: z.literal(true),
              merged: z.boolean(),
              mergedItemCount: z.number(),
            }),
          }),
        },
      },
    },
    mergeAnonymousSessionController,
  )

  // Profile Endpoints
  typedApp.get(
    '/profile',
    {
      preHandler: [app.authenticateCustomer],
      schema: {
        tags: ['Customer Profile'],
        summary: 'Consultar perfil do cliente autenticado',
        security: [{ bearerAuth: [] }],
      },
    },
    getCustomerProfileController,
  )

  typedApp.patch(
    '/profile',
    {
      preHandler: [app.authenticateCustomer],
      schema: {
        tags: ['Customer Profile'],
        summary:
          'Atualizar dados cadastrais do perfil do cliente (nome, telefone, CPF/CNPJ)',
        security: [{ bearerAuth: [] }],
        body: updateCustomerProfileBodySchema,
      },
    },
    updateCustomerProfileExtendedController,
  )

  // CEP Lookup Endpoint (Public/Authenticated)
  typedApp.get(
    '/cep/:zipCode',
    {
      schema: {
        tags: ['Customer Addresses'],
        summary:
          'Consultar endereço automaticamente via CEP (ViaCEP / BrasilAPI)',
        params: z.object({ zipCode: z.string() }),
      },
    },
    lookupCepController,
  )

  // Addresses CRUD Endpoints
  typedApp.get(
    '/addresses',
    {
      preHandler: [app.authenticateCustomer],
      schema: {
        tags: ['Customer Addresses'],
        summary: 'Listar todos os endereços de entrega do cliente autenticado',
        security: [{ bearerAuth: [] }],
      },
    },
    listAddressesController,
  )

  typedApp.post(
    '/addresses',
    {
      preHandler: [app.authenticateCustomer],
      schema: {
        tags: ['Customer Addresses'],
        summary: 'Cadastrar novo endereço de entrega',
        security: [{ bearerAuth: [] }],
        body: createAddressBodySchema,
      },
    },
    createAddressController,
  )

  typedApp.get(
    '/addresses/:id',
    {
      preHandler: [app.authenticateCustomer],
      schema: {
        tags: ['Customer Addresses'],
        summary: 'Obter detalhes de um endereço de entrega por ID',
        security: [{ bearerAuth: [] }],
        params: z.object({ id: z.string() }),
      },
    },
    getAddressDetailsController,
  )

  typedApp.patch(
    '/addresses/:id',
    {
      preHandler: [app.authenticateCustomer],
      schema: {
        tags: ['Customer Addresses'],
        summary: 'Atualizar endereço de entrega',
        security: [{ bearerAuth: [] }],
        params: z.object({ id: z.string() }),
        body: updateAddressBodySchema,
      },
    },
    updateAddressController,
  )

  typedApp.patch(
    '/addresses/:id/default',
    {
      preHandler: [app.authenticateCustomer],
      schema: {
        tags: ['Customer Addresses'],
        summary: 'Definir um endereço como padrão de entrega',
        security: [{ bearerAuth: [] }],
        params: z.object({ id: z.string() }),
      },
    },
    setDefaultAddressController,
  )

  typedApp.delete(
    '/addresses/:id',
    {
      preHandler: [app.authenticateCustomer],
      schema: {
        tags: ['Customer Addresses'],
        summary: 'Remover um endereço de entrega',
        security: [{ bearerAuth: [] }],
        params: z.object({ id: z.string() }),
      },
    },
    deleteAddressController,
  )
}
