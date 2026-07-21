import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
  loginController,
  logoutController,
  refreshController,
  forgotPasswordController,
  resetPasswordController,
  changePasswordController,
  meController,
} from './auth-users.controller'
import {
  loginBodySchema,
  forgotPasswordBodySchema,
  resetPasswordBodySchema,
  changePasswordBodySchema,
} from './auth-users.schemas'

export async function authUsersRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>()

  typedApp.post(
    '/login',
    {
      schema: {
        tags: ['Auth — Management Users'],
        summary: 'Autenticar usuário gestor',
        body: loginBodySchema,
      },
    },
    loginController
  )

  typedApp.post(
    '/logout',
    {
      preHandler: [app.authenticateUser],
      schema: {
        tags: ['Auth — Management Users'],
        summary: 'Encerrar sessão do usuário gestor',
        security: [{ bearerAuth: [] }],
      },
    },
    logoutController
  )

  typedApp.post(
    '/refresh',
    {
      schema: {
        tags: ['Auth — Management Users'],
        summary: 'Renovar token de acesso do usuário gestor',
      },
    },
    refreshController
  )

  typedApp.post(
    '/forgot-password',
    {
      schema: {
        tags: ['Auth — Management Users'],
        summary: 'Solicitar recuperação de senha do usuário gestor',
        body: forgotPasswordBodySchema,
      },
    },
    forgotPasswordController
  )

  typedApp.post(
    '/reset-password',
    {
      schema: {
        tags: ['Auth — Management Users'],
        summary: 'Redefinir senha do usuário gestor via token',
        body: resetPasswordBodySchema,
      },
    },
    resetPasswordController
  )

  typedApp.post(
    '/change-password',
    {
      preHandler: [app.authenticateUser],
      schema: {
        tags: ['Auth — Management Users'],
        summary: 'Alterar própria senha do usuário gestor',
        security: [{ bearerAuth: [] }],
        body: changePasswordBodySchema,
      },
    },
    changePasswordController
  )

  typedApp.get(
    '/me',
    {
      preHandler: [app.authenticateUser],
      schema: {
        tags: ['Auth — Management Users'],
        summary: 'Retornar dados do usuário gestor autenticado',
        security: [{ bearerAuth: [] }],
      },
    },
    meController
  )
}
