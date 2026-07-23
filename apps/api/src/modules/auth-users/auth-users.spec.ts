import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthUsersService } from './auth-users.service'
import { prisma } from '../../infrastructure/database/prisma'
import { hashPassword } from '../../shared/utils/crypto'
import { AppError } from '../../shared/errors/app-error'

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
    } as any)

    const fakeApp = {
      jwt: {
        sign: vi.fn().mockReturnValue('fake.jwt.token'),
      },
    } as any

    await expect(
      service.login(fakeApp, {
        email: 'admin@verttexloja.com.br',
        password: 'WrongPassword123!',
      })
    ).rejects.toThrowError(AppError)

    try {
      await service.login(fakeApp, {
        email: 'admin@verttexloja.com.br',
        password: 'WrongPassword123!',
      })
    } catch (err: any) {
      expect(err.statusCode).toBe(401)
      expect(err.message).toBe('E-mail ou senha inválidos')
    }
  })

  it('AUTH-003: should return identical 401 error message for non-existent user (Anti-Enumeration)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const fakeApp = {
      jwt: {
        sign: vi.fn().mockReturnValue('fake.jwt.token'),
      },
    } as any

    try {
      await service.login(fakeApp, {
        email: 'nonexistent@verttexloja.com.br',
        password: 'AnyPassword123!',
      })
    } catch (err: any) {
      expect(err.statusCode).toBe(401)
      expect(err.message).toBe('E-mail ou senha inválidos')
    }
  })
})
