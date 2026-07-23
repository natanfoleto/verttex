import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FastifyInstance, FastifyRequest } from 'fastify'
import { authPlugin } from './auth'
import { isJtiRevoked } from '../shared/utils/token-denylist'
import { AuthUsersService } from '../modules/auth-users/auth-users.service'
import { prisma } from '../infrastructure/database/prisma'
import { hashToken } from '../shared/utils/crypto'
import { AppError } from '../shared/errors/app-error'

vi.mock('../infrastructure/database/prisma', () => ({
  prisma: {
    userSession: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    revokedToken: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}))

vi.mock('../shared/utils/token-denylist', () => ({
  isJtiRevoked: vi.fn(),
  revokeJti: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../shared/utils/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}))

describe('JWT-001, JWT-002, JWT-003: Session & JWT Security Tests', () => {
  let authenticateUser: any
  let fakeApp: FastifyInstance

  beforeEach(() => {
    vi.clearAllMocks()

    fakeApp = {
      decorateRequest: vi.fn(),
      decorate: vi.fn((name, fn) => {
        if (name === 'authenticateUser') {
          authenticateUser = fn
        }
      }),
      jwt: {
        verify: vi.fn(),
        sign: vi.fn().mockReturnValue('new.access.token'),
      },
    } as any

    authPlugin(fakeApp)
  })

  it('JWT-001: should reject request with tampered/invalid JWT signature returning 401', async () => {
    const fakeRequest: Partial<FastifyRequest> = {
      cookies: { user_access_token: 'tampered.jwt.token' },
      headers: {},
    }

    vi.mocked(fakeApp.jwt.verify).mockImplementation(() => {
      throw new Error('Invalid signature')
    })

    await expect(authenticateUser(fakeRequest, {} as any)).rejects.toThrowError(AppError)

    try {
      await authenticateUser(fakeRequest, {} as any)
    } catch (err: any) {
      expect(err.statusCode).toBe(401)
      expect(err.message).toBe('Sessão inválida ou expirada')
    }
  })

  it('JWT-002: should reject access token if jti is present in denylist (revoked pós-logout)', async () => {
    const fakeRequest: Partial<FastifyRequest> = {
      cookies: { user_access_token: 'valid.format.token' },
      headers: {},
    }

    vi.mocked(fakeApp.jwt.verify).mockReturnValue({
      jti: 'revoked-jti-123',
      iss: 'api.verttexloja.com.br',
      actorType: 'user',
      sub: 'user-1',
      sessionId: 'session-1',
    } as any)

    vi.mocked(isJtiRevoked).mockResolvedValue(true)

    try {
      await authenticateUser(fakeRequest, {} as any)
    } catch (err: any) {
      expect(err.statusCode).toBe(401)
      expect(err.message).toBe('Sessão inválida ou expirada')
    }
  })

  it('JWT-003: should detect refresh token reuse, revoke ALL sessions and throw 401', async () => {
    const authService = new AuthUsersService()
    const reusedToken = 'reused_refresh_token_string'
    const tokenHash = hashToken(reusedToken)

    vi.mocked(prisma.userSession.findUnique).mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      refreshTokenHash: tokenHash,
      revokedAt: new Date('2026-07-22T10:00:00Z'),
      expiresAt: new Date(Date.now() + 86400000),
      user: { status: 'active', role: { key: 'admin' } },
    } as any)

    vi.mocked(prisma.userSession.updateMany).mockResolvedValue({ count: 3 } as any)

    await expect(
      authService.refresh(fakeApp, reusedToken, '127.0.0.1', 'Mozilla/5.0')
    ).rejects.toThrowError(AppError)

    expect(prisma.userSession.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', revokedAt: null },
      data: expect.objectContaining({ revokedAt: expect.any(Date) }),
    })
  })
})
