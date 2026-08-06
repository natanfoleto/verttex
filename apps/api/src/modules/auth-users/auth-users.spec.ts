import { FastifyInstance } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { prisma } from '../../infrastructure/database/prisma'
import { AppError } from '../../shared/errors/app-error'
import { hashPassword } from '../../shared/utils/crypto'
import { AuthUsersService } from './auth-users.service'

vi.mock('../../infrastructure/database/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    userSession: {
      create: vi.fn(),
    },
  },
}))

vi.mock('../../shared/utils/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}))

describe('AUTH-001 & AUTH-003: Auth Users Service — Login Security & Anti-Enumeration', () => {
  const service = new AuthUsersService()
  let validPasswordHash: string

  beforeEach(async () => {
    vi.clearAllMocks()
    validPasswordHash = await hashPassword('CorrectPassword123!')
  })

  it('AUTH-001: should reject login with wrong password returning 401 and generic message', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-1',
      name: 'Admin Test',
      email: 'admin@verttexloja.com.br',
      passwordHash: validPasswordHash,
      status: 'active',
      roleId: 'role-1',
      role: { key: 'admin' },
    } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>)

    const fakeApp = {
      jwt: {
        sign: vi.fn().mockReturnValue('fake.jwt.token'),
      },
    } as unknown as FastifyInstance

    await expect(
      service.login(fakeApp, {
        email: 'admin@verttexloja.com.br',
        password: 'WrongPassword123!',
      }),
    ).rejects.toThrowError(AppError)

    try {
      await service.login(fakeApp, {
        email: 'admin@verttexloja.com.br',
        password: 'WrongPassword123!',
      })
    } catch (err: unknown) {
      const error = err as AppError
      expect(error.statusCode).toBe(401)
      expect(error.message).toBe('E-mail ou senha inválidos')
    }
  })

  it('AUTH-003: should return identical 401 error message for non-existent user (Anti-Enumeration)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const fakeApp = {
      jwt: {
        sign: vi.fn().mockReturnValue('fake.jwt.token'),
      },
    } as unknown as FastifyInstance

    try {
      await service.login(fakeApp, {
        email: 'nonexistent@verttexloja.com.br',
        password: 'AnyPassword123!',
      })
    } catch (err: unknown) {
      const error = err as AppError
      expect(error.statusCode).toBe(401)
      expect(error.message).toBe('E-mail ou senha inválidos')
    }
  })
})
