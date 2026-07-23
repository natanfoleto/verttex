import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildApp } from './app'
import { prisma } from './infrastructure/database/prisma'

vi.mock('./infrastructure/database/prisma', () => ({
  prisma: {
    userSession: {
      findUnique: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
    },
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn().mockResolvedValue({ id: 'audit-1' }),
    },
  },
}))

vi.mock('./shared/utils/token-denylist', () => ({
  isJtiRevoked: vi.fn().mockResolvedValue(false),
}))

describe('AUTHZ-001, AUTHZ-002, AUTHZ-003: Authorization, IDOR & Mass Assignment Tests', () => {
  const mockActiveSession = (userId: string, roleKey: string) => {
    vi.mocked(prisma.userSession.findUnique).mockResolvedValue({
      id: `session-${userId}`,
      userId,
      revokedAt: null,
      expiresAt: new Date(Date.now() + 86400000),
      user: {
        id: userId,
        status: 'active',
        role: {
          key: roleKey,
          permissions: [],
        },
        permissions: [],
      },
    } as any)
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('AUTHZ-001: should reject unauthorized IDOR user query (GET /users/:userId) returning HTTP 403', async () => {
    mockActiveSession('user-employee-1', 'employee')

    const app = buildApp()
    await app.ready()

    const token = app.jwt.sign({
      sub: 'user-employee-1',
      actorType: 'user',
      role: 'employee',
      sessionId: 'session-user-employee-1',
      iss: 'api.verttexloja.com.br',
      jti: 'jti-employee-1',
    })

    const response = await app.inject({
      method: 'GET',
      url: '/users/target-user-999',
      cookies: { user_access_token: token },
    })

    expect(response.statusCode).toBe(403)
    const body = JSON.parse(response.body)
    expect(body.error.code).toBe('FORBIDDEN')

    await app.close()
  })

  it('AUTHZ-002: should reject Cross-Store access for user lacking store management permissions returning 403', async () => {
    mockActiveSession('user-supplier-1', 'supplier')

    const app = buildApp()
    await app.ready()

    const token = app.jwt.sign({
      sub: 'user-supplier-1',
      actorType: 'user',
      role: 'supplier',
      sessionId: 'session-user-supplier-1',
      iss: 'api.verttexloja.com.br',
      jti: 'jti-supplier-1',
    })

    const response = await app.inject({
      method: 'PATCH',
      url: '/stores/store-other-999',
      cookies: { user_access_token: token },
      payload: { name: 'Hacked Store Name' },
    })

    expect(response.statusCode).toBe(403)
    const body = JSON.parse(response.body)
    expect(body.error.code).toBe('FORBIDDEN')

    await app.close()
  })

  it('AUTHZ-003: should reject Mass Assignment attempt to modify user role/status without permissions returning 403', async () => {
    mockActiveSession('user-employee-1', 'employee')

    const app = buildApp()
    await app.ready()

    const token = app.jwt.sign({
      sub: 'user-employee-1',
      actorType: 'user',
      role: 'employee',
      sessionId: 'session-user-employee-1',
      iss: 'api.verttexloja.com.br',
      jti: 'jti-employee-1',
    })

    const response = await app.inject({
      method: 'PATCH',
      url: '/users/user-employee-1',
      cookies: { user_access_token: token },
      payload: { roleId: 'role-admin-id', status: 'active' },
    })

    expect(response.statusCode).toBe(403)
    const body = JSON.parse(response.body)
    expect(body.error.code).toBe('FORBIDDEN')

    await app.close()
  })
})
