import { FastifyInstance } from 'fastify'
import { prisma } from '../../infrastructure/database/prisma'
import { AppError } from '../../shared/errors/app-error'
import { logAudit } from '../../shared/utils/audit'
import {
  hashPassword,
  verifyPassword,
  hashToken,
  generateRandomToken,
} from '../../shared/utils/crypto'
import {
  LoginBody,
  ForgotPasswordBody,
  ResetPasswordBody,
  ChangePasswordBody,
} from './auth-users.schemas'

export class AuthUsersService {
  async login(
    app: FastifyInstance,
    body: LoginBody,
    ipAddress?: string,
    userAgent?: string
  ) {
    const email = body.email.toLowerCase().trim()

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    })

    if (!user || user.status !== 'active') {
      throw new AppError('UNAUTHORIZED', 'E-mail ou senha inválidos', 401)
    }

    const isPasswordValid = await verifyPassword(
      body.password,
      user.passwordHash
    )
    if (!isPasswordValid) {
      throw new AppError('UNAUTHORIZED', 'E-mail ou senha inválidos', 401)
    }

    // Generate refresh token (random) & session
    const rawRefreshToken = generateRandomToken(32)
    const refreshTokenHash = hashToken(rawRefreshToken)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    const session = await prisma.userSession.create({
      data: {
        userId: user.id,
        refreshTokenHash,
        ipAddress,
        userAgent,
        expiresAt,
      },
    })

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    // Generate JWT access token (15 mins)
    const accessToken = app.jwt.sign(
      {
        sub: user.id,
        actorType: 'user',
        role: user.role.key,
        sessionId: session.id,
      },
      { expiresIn: '15m' }
    )

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entity: 'User',
        entityId: user.id,
        newValues: { email: user.email, role: user.role.key },
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      },
    })

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: {
          key: user.role.key,
          name: user.role.name,
        },
      },
    }
  }

  async logout(userId?: string, sessionId?: string) {
    if (!sessionId) return

    const session = await prisma.userSession.findUnique({
      where: { id: sessionId },
    })

    await prisma.userSession.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    })

    if (userId) {
      await logAudit({
        userId,
        action: 'LOGOUT',
        entity: 'User',
        entityId: userId,
        oldValues: session ? { sessionId: session.id, ipAddress: session.ipAddress } : null,
      })
    }
  }

  async refresh(
    app: FastifyInstance,
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const tokenHash = hashToken(refreshToken)

    const session = await prisma.userSession.findUnique({
      where: { refreshTokenHash: tokenHash },
      include: { user: { include: { role: true } } },
    })

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt < new Date() ||
      session.user.status !== 'active'
    ) {
      throw new AppError('UNAUTHORIZED', 'Sessão inválida ou expirada', 401)
    }

    // Revoke current session (Rotation)
    await prisma.userSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    })

    // Create new session
    const rawRefreshToken = generateRandomToken(32)
    const newRefreshTokenHash = hashToken(rawRefreshToken)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const newSession = await prisma.userSession.create({
      data: {
        userId: session.userId,
        refreshTokenHash: newRefreshTokenHash,
        ipAddress,
        userAgent,
        expiresAt,
      },
    })

    // Generate new JWT
    const accessToken = app.jwt.sign(
      {
        sub: session.user.id,
        actorType: 'user',
        role: session.user.role.key,
        sessionId: newSession.id,
      },
      { expiresIn: '15m' }
    )

    return {
      accessToken,
      refreshToken: rawRefreshToken,
    }
  }

  async forgotPassword(body: ForgotPasswordBody) {
    const email = body.email.toLowerCase().trim()
    const user = await prisma.user.findUnique({ where: { email } })

    // Security practice: Always return generic message whether user exists or not
    const genericResponse = {
      message:
        'Se existir uma conta associada ao e-mail informado, enviaremos as instruções de recuperação.',
    }

    if (!user || user.status !== 'active') {
      return genericResponse
    }

    // Invalidate previous active reset tokens
    await prisma.userPasswordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    })

    const rawToken = generateRandomToken(32)
    const tokenHash = hashToken(rawToken)
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hour

    await prisma.userPasswordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    })

    console.log(`🔑 [DEV RESET TOKEN] Email: ${email} | Token: ${rawToken}`)

    return genericResponse
  }

  async resetPassword(body: ResetPasswordBody) {
    const tokenHash = hashToken(body.token)

    const resetToken = await prisma.userPasswordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    })

    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt < new Date() ||
      resetToken.user.status !== 'active'
    ) {
      throw new AppError(
        'UNAUTHORIZED',
        'Token de recuperação inválido ou expirado',
        400
      )
    }

    const newPasswordHash = await hashPassword(body.newPassword)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash: newPasswordHash },
      }),
      prisma.userPasswordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      // Revoke all existing sessions after password reset
      prisma.userSession.updateMany({
        where: { userId: resetToken.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ])

    await logAudit({
      userId: resetToken.userId,
      action: 'PASSWORD_RESET',
      entity: 'User',
      entityId: resetToken.userId,
    })

    return { message: 'Senha redefinida com sucesso!' }
  }

  async changePassword(userId: string, body: ChangePasswordBody) {
    const user = await prisma.user.findUnique({ where: { id: userId } })

    if (!user) {
      throw new AppError('NOT_FOUND', 'Usuário não encontrado', 404)
    }

    const isCurrentValid = await verifyPassword(
      body.currentPassword,
      user.passwordHash
    )
    if (!isCurrentValid) {
      throw new AppError('VALIDATION_ERROR', 'Senha atual incorreta', 400)
    }

    const newPasswordHash = await hashPassword(body.newPassword)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
      }),
      // Revoke sessions
      prisma.userSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ])

    await logAudit({
      userId,
      action: 'PASSWORD_CHANGE',
      entity: 'User',
      entityId: userId,
    })

    return { message: 'Senha alterada com sucesso!' }
  }

  async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
        permissions: {
          include: { permission: true },
        },
        stores: {
          include: { store: true },
        },
      },
    })

    if (!user || user.status !== 'active') {
      throw new AppError('NOT_FOUND', 'Usuário não encontrado', 404)
    }

    // Build permissions list (role defaults + individual overrides)
    const permissionsList: Array<{
      key: string
      effect: 'allow' | 'deny'
      origin: 'role' | 'override'
    }> = []

    const overrideKeys = new Set(user.permissions.map((p) => p.permission.key))

    // Admin role has manage all
    if (user.role.key === 'admin') {
      permissionsList.push({
        key: 'manage.all',
        effect: 'allow',
        origin: 'role',
      })
    }

    // Add role default permissions
    for (const rp of user.role.permissions) {
      if (!overrideKeys.has(rp.permission.key)) {
        permissionsList.push({
          key: rp.permission.key,
          effect: 'allow',
          origin: 'role',
        })
      }
    }

    // Add individual overrides
    for (const up of user.permissions) {
      permissionsList.push({
        key: up.permission.key,
        effect: up.effect as 'allow' | 'deny',
        origin: 'override',
      })
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      status: user.status,
      role: {
        id: user.role.id,
        key: user.role.key,
        name: user.role.name,
      },
      permissions: permissionsList,
      stores: user.stores.map((su) => ({
        id: su.store.id,
        name: su.store.name,
        slug: su.store.slug,
        isOwner: su.isOwner,
      })),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }
}
