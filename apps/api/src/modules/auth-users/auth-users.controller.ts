import { FastifyReply } from 'fastify'
import { FastifyZodRequest } from '../../@types/fastify'
import { prisma } from '../../infrastructure/database/prisma'
import { AuthUsersService } from './auth-users.service'
import {
  LoginBody,
  ForgotPasswordBody,
  ResetPasswordBody,
  ChangePasswordBody,
} from './auth-users.schemas'
import { AppError } from '../../shared/errors/app-error'

const authUsersService = new AuthUsersService()
const isProduction = process.env.NODE_ENV === 'production'

export async function loginController(
  request: FastifyZodRequest<{ Body: LoginBody }>,
  reply: FastifyReply
) {
  try {
    const result = await authUsersService.login(
      request.server,
      request.body,
      request.ip,
      request.headers['user-agent']
    )

    reply
      .setCookie('user_access_token', result.accessToken, {
        path: '/',
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 15 * 60, // 15 minutes
      })
      .setCookie('user_refresh_token', result.refreshToken, {
        path: '/auth/users',
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      })

    return reply.send({
      success: true,
      data: result,
    })
  } catch (err) {
    // Record LOGIN_FAILED for failed login attempts (don't expose whether email exists)
    await prisma.auditLog.create({
      data: {
        userId: null,
        action: 'LOGIN_FAILED',
        entity: 'User',
        entityId: null,
        newValues: { attemptedEmail: request.body.email },
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] ?? null,
      },
    }).catch(() => {}) // best-effort, never throw
    throw err
  }
}

export async function logoutController(
  request: FastifyZodRequest,
  reply: FastifyReply
) {
  // Extract jti and exp from the current access token for immediate denylist
  let jti: string | undefined
  let tokenExp: number | undefined

  try {
    const token =
      request.cookies.user_access_token ||
      (request.headers.authorization?.split(' ')[1])

    if (token) {
      const decoded = request.server.jwt.decode<{ jti?: string; exp?: number }>(token)
      jti = decoded?.jti
      tokenExp = decoded?.exp
    }
  } catch {
    // Ignore decode errors — logout proceeds regardless
  }

  await authUsersService.logout(
    request.userPayload?.id,
    request.userPayload?.sessionId,
    jti,
    tokenExp
  )

  reply
    .clearCookie('user_access_token', { path: '/' })
    .clearCookie('user_refresh_token', { path: '/auth/users' })

  return reply.send({
    success: true,
    data: { message: 'Desconectado com sucesso!' },
  })
}

export async function refreshController(
  request: FastifyZodRequest<{ Body?: { refreshToken?: string } }>,
  reply: FastifyReply
) {
  const refreshToken =
    request.cookies.user_refresh_token || request.body?.refreshToken

  if (!refreshToken) {
    throw new AppError('UNAUTHORIZED', 'Refresh token ausente', 401)
  }

  const result = await authUsersService.refresh(
    request.server,
    refreshToken,
    request.ip,
    request.headers['user-agent']
  )

  reply
    .setCookie('user_access_token', result.accessToken, {
      path: '/',
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 15 * 60,
    })
    .setCookie('user_refresh_token', result.refreshToken, {
      path: '/auth/users',
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
    })

  return reply.send({
    success: true,
    data: result,
  })
}

export async function forgotPasswordController(
  request: FastifyZodRequest<{ Body: ForgotPasswordBody }>,
  reply: FastifyReply
) {
  const result = await authUsersService.forgotPassword(request.body)
  return reply.send({
    success: true,
    data: result,
  })
}

export async function resetPasswordController(
  request: FastifyZodRequest<{ Body: ResetPasswordBody }>,
  reply: FastifyReply
) {
  const result = await authUsersService.resetPassword(request.body)

  reply
    .clearCookie('user_access_token', { path: '/' })
    .clearCookie('user_refresh_token', { path: '/auth/users' })

  return reply.send({
    success: true,
    data: result,
  })
}

export async function changePasswordController(
  request: FastifyZodRequest,
  reply: FastifyReply
) {
  const userId = request.userPayload!.id
  const body = request.body as ChangePasswordBody
  const result = await authUsersService.changePassword(userId, body)

  reply
    .clearCookie('user_access_token', { path: '/' })
    .clearCookie('user_refresh_token', { path: '/auth/users' })

  return reply.send({
    success: true,
    data: result,
  })
}

export async function meController(
  request: FastifyZodRequest,
  reply: FastifyReply
) {
  const userId = request.userPayload!.id
  const profile = await authUsersService.getUserProfile(userId)

  return reply.send({
    success: true,
    data: profile,
  })
}

export async function listSessionsController(
  request: FastifyZodRequest,
  reply: FastifyReply
) {
  const userId = request.userPayload!.id
  const currentSessionId = request.userPayload?.sessionId
  const sessions = await authUsersService.listUserSessions(userId, currentSessionId)

  return reply.send({
    success: true,
    data: sessions,
  })
}

export async function revokeSessionController(
  request: FastifyZodRequest,
  reply: FastifyReply
) {
  const userId = request.userPayload!.id
  const params = request.params as { sessionId: string }
  const result = await authUsersService.revokeSession(userId, params.sessionId, request)

  return reply.send({
    success: true,
    data: result,
  })
}

export async function revokeOtherSessionsController(
  request: FastifyZodRequest,
  reply: FastifyReply
) {
  const userId = request.userPayload!.id
  const currentSessionId = request.userPayload!.sessionId!
  const result = await authUsersService.revokeOtherSessions(userId, currentSessionId, request)

  return reply.send({
    success: true,
    data: result,
  })
}
