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

export async function authUsersRoutes(app: FastifyInstance) {
  const typedApp = app.withTypeProvider<ZodTypeProvider>()

  /**
   * POST /auth/users/login
   *
   * Rate limit: 20 attempts per IP per 15 minutes.
   * A second per-account limit (5/15min) should be added via service-level
   * tracking when Redis is available (see RATE_LIMIT_MATRIX.md).
   *
   * @security RATE_LIMIT_MATRIX.md — login
   */
  typedApp.post(
    '/login',
    {
      config: {
        rateLimit: {
          max: 20,
          timeWindow: '15 minutes',
          keyGenerator: (req) => `login:ip:${req.ip}`,
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

  /**
   * POST /auth/users/refresh
   *
   * Rate limit: 30 refreshes per IP per 15 minutes.
   *
   * @security RATE_LIMIT_MATRIX.md — refresh
   */
  typedApp.post(
    '/refresh',
    {
      config: {
        rateLimit: {
          max: 30,
          timeWindow: '15 minutes',
          keyGenerator: (req) => `refresh:ip:${req.ip}`,
        },
      },
      schema: {
        tags: ['Auth — Management Users'],
        summary: 'Renovar token de acesso do usuário gestor',
      },
    },
    refreshController
  )

  /**
   * POST /auth/users/forgot-password
   *
   * Rate limit: 10 requests per IP per 30 minutes.
   *
   * @security RATE_LIMIT_MATRIX.md — forgot-password
   */
  typedApp.post(
    '/forgot-password',
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '30 minutes',
          keyGenerator: (req) => `forgot:ip:${req.ip}`,
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

  /**
   * POST /auth/users/reset-password
   *
   * Rate limit: 5 attempts per IP per 15 minutes.
   *
   * @security RATE_LIMIT_MATRIX.md — reset-password
   */
  typedApp.post(
    '/reset-password',
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '15 minutes',
          keyGenerator: (req) => `reset:ip:${req.ip}`,
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

  /**
   * POST /auth/users/change-password
   *
   * Rate limit: 5 attempts per authenticated user per 15 minutes.
   *
   * @security RATE_LIMIT_MATRIX.md — change-password
   */
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
