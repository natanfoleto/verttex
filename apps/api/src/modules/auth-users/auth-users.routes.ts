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
  listSessionsController,
  revokeSessionController,
  revokeOtherSessionsController,
} from './auth-users.controller'
import {
  loginBodySchema,
  forgotPasswordBodySchema,
  resetPasswordBodySchema,
  changePasswordBodySchema,
} from './auth-users.schemas'

const isDev = process.env.NODE_ENV === 'development'

export async function authUsersRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>()

  typedApp.post(
    '/login',
    {
      config: {
        rateLimit: {
          max: 20,
          timeWindow: '15 minutes',
          keyGenerator: (req) => `login:ip:${req.ip}`,
          allowList: () => isDev,
          errorResponseBuilder: (_req, context) => ({
            success: false,
            error: 'RATE_LIMIT_EXCEEDED',
            message: `Muitas tentativas de login. Tente novamente em ${Math.ceil(context.ttl / 1000)} segundo(s).`,
            retryAfter: Math.ceil(context.ttl / 1000),
          }),
        },
      },
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
      config: {
        rateLimit: {
          max: 30,
          timeWindow: '15 minutes',
          keyGenerator: (req) => `refresh:ip:${req.ip}`,
          allowList: () => isDev,
        },
      },
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
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '30 minutes',
          keyGenerator: (req) => `forgot:ip:${req.ip}`,
          allowList: () => isDev,
          errorResponseBuilder: (_req, context) => ({
            success: false,
            error: 'RATE_LIMIT_EXCEEDED',
            message: `Muitas solicitações de recuperação. Tente novamente em ${Math.ceil(context.ttl / 60000)} minuto(s).`,
            retryAfter: Math.ceil(context.ttl / 1000),
          }),
        },
      },
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
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '15 minutes',
          keyGenerator: (req) => `reset:ip:${req.ip}`,
          allowList: () => isDev,
        },
      },
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
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '15 minutes',
          keyGenerator: (req) => {
            const payload = (req as any).userPayload
            return `change-pwd:user:${payload?.id ?? req.ip}`
          },
          allowList: () => isDev,
        },
      },
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

  typedApp.get(
    '/sessions',
    {
      preHandler: [app.authenticateUser],
      schema: {
        tags: ['Auth — Management Users'],
        summary: 'Listar sessões ativas do usuário gestor',
        security: [{ bearerAuth: [] }],
      },
    },
    listSessionsController
  )

  typedApp.delete(
    '/sessions/others',
    {
      preHandler: [app.authenticateUser],
      schema: {
        tags: ['Auth — Management Users'],
        summary: 'Encerrar todas as outras sessões ativas do usuário',
        security: [{ bearerAuth: [] }],
      },
    },
    revokeOtherSessionsController
  )

  typedApp.delete(
    '/sessions/:sessionId',
    {
      preHandler: [app.authenticateUser],
      schema: {
        tags: ['Auth — Management Users'],
        summary: 'Encerrar uma sessão ativa específica',
        security: [{ bearerAuth: [] }],
      },
    },
    revokeSessionController
  )
}
