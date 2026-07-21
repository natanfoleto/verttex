import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
  registerCustomerController,
  loginCustomerController,
  logoutCustomerController,
  refreshCustomerController,
  forgotPasswordCustomerController,
  resetPasswordCustomerController,
  changePasswordCustomerController,
  meCustomerController,
} from './auth-customers.controller'
import {
  customerRegisterBodySchema,
  customerLoginBodySchema,
  customerForgotPasswordBodySchema,
  customerResetPasswordBodySchema,
  customerChangePasswordBodySchema,
} from './auth-customers.schemas'

export async function authCustomersRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>()

  typedApp.post(
    '/register',
    {
      schema: {
        tags: ['Auth — Marketplace Customers'],
        summary: 'Criar conta de cliente comprador',
        body: customerRegisterBodySchema,
      },
    },
    registerCustomerController
  )

  typedApp.post(
    '/login',
    {
      schema: {
        tags: ['Auth — Marketplace Customers'],
        summary: 'Autenticar cliente comprador',
        body: customerLoginBodySchema,
      },
    },
    loginCustomerController
  )

  typedApp.post(
    '/logout',
    {
      preHandler: [app.authenticateCustomer],
      schema: {
        tags: ['Auth — Marketplace Customers'],
        summary: 'Encerrar sessão do cliente comprador',
        security: [{ bearerAuth: [] }],
      },
    },
    logoutCustomerController
  )

  typedApp.post(
    '/refresh',
    {
      schema: {
        tags: ['Auth — Marketplace Customers'],
        summary: 'Renovar token de acesso do cliente comprador',
      },
    },
    refreshCustomerController
  )

  typedApp.post(
    '/forgot-password',
    {
      schema: {
        tags: ['Auth — Marketplace Customers'],
        summary: 'Solicitar recuperação de senha do cliente',
        body: customerForgotPasswordBodySchema,
      },
    },
    forgotPasswordCustomerController
  )

  typedApp.post(
    '/reset-password',
    {
      schema: {
        tags: ['Auth — Marketplace Customers'],
        summary: 'Redefinir senha do cliente via token',
        body: customerResetPasswordBodySchema,
      },
    },
    resetPasswordCustomerController
  )

  typedApp.post(
    '/change-password',
    {
      preHandler: [app.authenticateCustomer],
      schema: {
        tags: ['Auth — Marketplace Customers'],
        summary: 'Alterar própria senha do cliente',
        security: [{ bearerAuth: [] }],
        body: customerChangePasswordBodySchema,
      },
    },
    changePasswordCustomerController
  )

  typedApp.get(
    '/me',
    {
      preHandler: [app.authenticateCustomer],
      schema: {
        tags: ['Auth — Marketplace Customers'],
        summary: 'Retornar dados do cliente autenticado',
        security: [{ bearerAuth: [] }],
      },
    },
    meCustomerController
  )
}
