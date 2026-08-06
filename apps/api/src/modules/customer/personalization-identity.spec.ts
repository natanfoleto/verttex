import { FastifyReply, FastifyRequest } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CartService } from '../cart/cart.service'
import {
  PersonalizationIdentityService,
  VISITOR_COOKIE_NAME,
  VISITOR_COOKIE_TTL_SECONDS,
} from './personalization-identity.service'

interface MockProfile {
  id: string
  customerId: string | null
  visitorKeyHash: string | null
  personalizationEnabled: boolean
  lastSeenAt: Date
  expiresAt: Date | null
  createdAt: Date
  updatedAt: Date
}

interface MockCartItem {
  id: string
  cartId: string
  variationId: string
  storeId: string
  quantity: number
  unitPrice: number
}

interface MockCart {
  id: string
  customerId: string | null
  sessionId: string | null
  status: string
  items: MockCartItem[]
  createdAt: Date
  updatedAt: Date
}

interface CookieCallRecord {
  name: string
  val: string
  opts: Record<string, unknown>
}

// In-memory mock database state
let mockProfiles: Record<string, MockProfile> = {}
let mockCarts: Record<string, MockCart> = {}
let mockCartItems: Record<string, MockCartItem> = {}

vi.mock('../../infrastructure/database/prisma', () => ({
  prisma: {
    $transaction: vi.fn().mockImplementation(async (cb) => {
      const tx = {
        personalizationProfile: {
          findUnique: vi.fn().mockImplementation(async ({ where }) => {
            if (where.customerId) {
              return (
                Object.values(mockProfiles).find(
                  (p) => p.customerId === where.customerId,
                ) || null
              )
            }
            if (where.visitorKeyHash) {
              return (
                Object.values(mockProfiles).find(
                  (p) => p.visitorKeyHash === where.visitorKeyHash,
                ) || null
              )
            }
            if (where.id) {
              return mockProfiles[where.id] || null
            }
            return null
          }),
          create: vi.fn().mockImplementation(async ({ data }) => {
            const id = `prof_${Math.random().toString(36).substring(2, 9)}`
            const profile: MockProfile = {
              id,
              customerId: data.customerId || null,
              visitorKeyHash: data.visitorKeyHash || null,
              personalizationEnabled: data.personalizationEnabled ?? true,
              lastSeenAt: data.lastSeenAt || new Date(),
              expiresAt: data.expiresAt || null,
              createdAt: new Date(),
              updatedAt: new Date(),
            }
            mockProfiles[id] = profile
            return profile
          }),
          update: vi.fn().mockImplementation(async ({ where, data }) => {
            const profile = mockProfiles[where.id]
            if (!profile) throw new Error('Profile not found')
            Object.assign(profile, data, { updatedAt: new Date() })
            return profile
          }),
          delete: vi.fn().mockImplementation(async ({ where }) => {
            const profile = mockProfiles[where.id]
            if (profile) delete mockProfiles[where.id]
            return profile
          }),
        },
        cart: {
          findUnique: vi.fn().mockImplementation(async ({ where }) => {
            const cart = mockCarts[where.id]
            if (!cart) return null
            const items = Object.values(mockCartItems).filter(
              (i) => i.cartId === cart.id,
            )
            return { ...cart, items }
          }),
          findFirst: vi.fn().mockImplementation(async ({ where }) => {
            const found = Object.values(mockCarts).find((c) => {
              if (c.status !== where.status) return false
              if (where.customerId) return c.customerId === where.customerId
              if (where.sessionId) return c.sessionId === where.sessionId
              return false
            })
            if (!found) return null
            const items = Object.values(mockCartItems).filter(
              (i) => i.cartId === found.id,
            )
            return { ...found, items }
          }),
          create: vi.fn().mockImplementation(async ({ data }) => {
            const id = `cart_${Math.random().toString(36).substring(2, 9)}`
            const cart: MockCart = {
              id,
              customerId: data.customerId || null,
              sessionId: data.sessionId || null,
              status: data.status || 'active',
              items: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            }
            mockCarts[id] = cart
            return cart
          }),
          update: vi.fn().mockImplementation(async ({ where, data }) => {
            const cart = mockCarts[where.id]
            if (cart) Object.assign(cart, data)
            return cart
          }),
        },
        cartItem: {
          findFirst: vi.fn().mockImplementation(async ({ where }) => {
            return (
              Object.values(mockCartItems).find(
                (i) =>
                  i.cartId === where.cartId &&
                  i.variationId === where.variationId,
              ) || null
            )
          }),
          create: vi.fn().mockImplementation(async ({ data }) => {
            const id = `item_${Math.random().toString(36).substring(2, 9)}`
            const item: MockCartItem = { id, ...data }
            mockCartItems[id] = item
            return item
          }),
          update: vi.fn().mockImplementation(async ({ where, data }) => {
            const item = mockCartItems[where.id]
            if (item) Object.assign(item, data)
            return item
          }),
        },
      }
      return cb(tx)
    }),
    personalizationProfile: {
      findUnique: vi.fn().mockImplementation(async ({ where }) => {
        if (where.customerId) {
          return (
            Object.values(mockProfiles).find(
              (p) => p.customerId === where.customerId,
            ) || null
          )
        }
        if (where.visitorKeyHash) {
          return (
            Object.values(mockProfiles).find(
              (p) => p.visitorKeyHash === where.visitorKeyHash,
            ) || null
          )
        }
        if (where.id) {
          return mockProfiles[where.id] || null
        }
        return null
      }),
      create: vi.fn().mockImplementation(async ({ data }) => {
        const id = `prof_${Math.random().toString(36).substring(2, 9)}`
        const profile: MockProfile = {
          id,
          customerId: data.customerId || null,
          visitorKeyHash: data.visitorKeyHash || null,
          personalizationEnabled: data.personalizationEnabled ?? true,
          lastSeenAt: data.lastSeenAt || new Date(),
          expiresAt: data.expiresAt || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        mockProfiles[id] = profile
        return profile
      }),
      update: vi.fn().mockImplementation(async ({ where, data }) => {
        const profile = mockProfiles[where.id]
        if (!profile) throw new Error('Profile not found')
        Object.assign(profile, data, { updatedAt: new Date() })
        return profile
      }),
      delete: vi.fn().mockImplementation(async ({ where }) => {
        const profile = mockProfiles[where.id]
        if (profile) delete mockProfiles[where.id]
        return profile
      }),
    },
    cart: {
      findUnique: vi.fn().mockImplementation(async ({ where }) => {
        const cart = mockCarts[where.id]
        if (!cart) return null
        const items = Object.values(mockCartItems).filter(
          (i) => i.cartId === cart.id,
        )
        return { ...cart, items }
      }),
      findFirst: vi.fn().mockImplementation(async ({ where }) => {
        const found = Object.values(mockCarts).find((c) => {
          if (c.status !== where.status) return false
          if (where.customerId) return c.customerId === where.customerId
          if (where.sessionId) return c.sessionId === where.sessionId
          return false
        })
        if (!found) return null
        const items = Object.values(mockCartItems).filter(
          (i) => i.cartId === found.id,
        )
        return { ...found, items }
      }),
      create: vi.fn().mockImplementation(async ({ data }) => {
        const id = `cart_${Math.random().toString(36).substring(2, 9)}`
        const cart: MockCart = {
          id,
          customerId: data.customerId || null,
          sessionId: data.sessionId || null,
          status: data.status || 'active',
          items: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        mockCarts[id] = cart
        return cart
      }),
      update: vi.fn().mockImplementation(async ({ where, data }) => {
        const cart = mockCarts[where.id]
        if (cart) Object.assign(cart, data)
        return cart
      }),
    },
  },
}))

vi.mock('../../shared/utils/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}))

describe('PersonalizationIdentityService (Push 1A Hardened)', () => {
  beforeEach(() => {
    mockProfiles = {}
    mockCarts = {}
    mockCartItems = {}
    vi.clearAllMocks()
  })

  it('generates a 256-bit (64 hex char) random raw visitor token', () => {
    const token = PersonalizationIdentityService.generateRawVisitorToken()
    expect(token).toHaveLength(64)
    expect(token).toMatch(/^[0-9a-f]{64}$/)
  })

  it('correctly signs and verifies a valid visitor token', () => {
    const rawToken = PersonalizationIdentityService.generateRawVisitorToken()
    const signedValue =
      PersonalizationIdentityService.signVisitorToken(rawToken)

    expect(signedValue).toContain(rawToken)
    expect(signedValue).toContain('.')

    const verified =
      PersonalizationIdentityService.verifyVisitorToken(signedValue)
    expect(verified).toBe(rawToken)
  })

  it('rejects tampered or malformed signed tokens', () => {
    const rawToken = PersonalizationIdentityService.generateRawVisitorToken()
    const signedValue =
      PersonalizationIdentityService.signVisitorToken(rawToken)

    const tamperedToken = 'a' + signedValue.substring(1)
    expect(
      PersonalizationIdentityService.verifyVisitorToken(tamperedToken),
    ).toBeNull()

    const tamperedSig = signedValue.substring(0, signedValue.length - 2) + '00'
    expect(
      PersonalizationIdentityService.verifyVisitorToken(tamperedSig),
    ).toBeNull()

    expect(
      PersonalizationIdentityService.verifyVisitorToken('invalid'),
    ).toBeNull()
    expect(PersonalizationIdentityService.verifyVisitorToken('')).toBeNull()
  })

  it('produces a deterministic domain-salted storage hash and never persists raw token', () => {
    const rawToken = PersonalizationIdentityService.generateRawVisitorToken()
    const hash1 =
      PersonalizationIdentityService.hashVisitorTokenForStorage(rawToken)
    const hash2 =
      PersonalizationIdentityService.hashVisitorTokenForStorage(rawToken)

    expect(hash1).toHaveLength(64)
    expect(hash1).toBe(hash2)
    // Raw token is NEVER stored as hash
    expect(hash1).not.toBe(rawToken)
  })

  it('creates profile and emits cookie with correct security attributes when cookie is missing', async () => {
    let cookieCall: CookieCallRecord | null = null
    const mockReply = {
      setCookie: (name: string, val: string, opts: Record<string, unknown>) => {
        cookieCall = { name, val, opts }
      },
    } as unknown as FastifyReply

    const req = { cookies: {} } as unknown as FastifyRequest

    const identity =
      await PersonalizationIdentityService.resolveProfileFromRequest(
        req,
        mockReply,
      )

    expect(identity.isCustomer).toBe(false)
    expect(identity.profile.id).toBeDefined()
    expect(cookieCall).not.toBeNull()
    expect(cookieCall!.name).toBe(VISITOR_COOKIE_NAME)
    expect(cookieCall!.opts.httpOnly).toBe(true)
    expect(cookieCall!.opts.sameSite).toBe('lax')
    expect(cookieCall!.opts.path).toBe('/')
    expect(cookieCall!.opts.maxAge).toBe(VISITOR_COOKIE_TTL_SECONDS)
  })

  it('does NOT reuse old token/hash if profile was revoked or consumed by merge', async () => {
    const oldRawToken = PersonalizationIdentityService.generateRawVisitorToken()
    const oldSigned =
      PersonalizationIdentityService.signVisitorToken(oldRawToken)

    // Old cookie sent, but DB has no profile for this hash (e.g. consumed by merge)
    let cookieCall: CookieCallRecord | null = null
    const mockReply = {
      setCookie: (name: string, val: string, opts: Record<string, unknown>) => {
        cookieCall = { name, val, opts }
      },
    } as unknown as FastifyReply

    const req = {
      cookies: { [VISITOR_COOKIE_NAME]: oldSigned },
    } as unknown as FastifyRequest

    const identity =
      await PersonalizationIdentityService.resolveProfileFromRequest(
        req,
        mockReply,
      )

    // A brand new token was issued!
    expect(identity.rawToken).not.toBe(oldRawToken)
    expect(cookieCall!.val).not.toBe(oldSigned)
  })

  it('resolves distinct isolated profiles and carts for two different visitors', async () => {
    const tokenA = PersonalizationIdentityService.generateRawVisitorToken()
    const tokenB = PersonalizationIdentityService.generateRawVisitorToken()

    const reqA = {
      cookies: {
        [VISITOR_COOKIE_NAME]:
          PersonalizationIdentityService.signVisitorToken(tokenA),
      },
    } as unknown as FastifyRequest

    const reqB = {
      cookies: {
        [VISITOR_COOKIE_NAME]:
          PersonalizationIdentityService.signVisitorToken(tokenB),
      },
    } as unknown as FastifyRequest

    const identityA =
      await PersonalizationIdentityService.resolveProfileFromRequest(reqA)
    const identityB =
      await PersonalizationIdentityService.resolveProfileFromRequest(reqB)

    expect(identityA.profile.id).not.toBe(identityB.profile.id)
    expect(identityA.profile.visitorKeyHash).not.toBe(
      identityB.profile.visitorKeyHash,
    )
  })

  it('merges anonymous cart items, combines duplicate quantities, and marks empty cart completed', async () => {
    let initialCookieCall: CookieCallRecord | null = null
    const mockInitialReply = {
      setCookie: (name: string, val: string, opts: Record<string, unknown>) => {
        initialCookieCall = { name, val, opts }
      },
    } as unknown as FastifyReply

    // 1. Initial request without cookie creates active profile and issues signed cookie
    const reqInitial = { cookies: {} } as unknown as FastifyRequest
    const identity =
      await PersonalizationIdentityService.resolveProfileFromRequest(
        reqInitial,
        mockInitialReply,
      )
    expect(identity.profile).toBeDefined()
    expect(initialCookieCall).not.toBeNull()

    const issuedSignedCookie = initialCookieCall!.val

    // 2. Visitor request with valid issued cookie
    const reqVisitor = {
      cookies: { [VISITOR_COOKIE_NAME]: issuedSignedCookie },
    } as unknown as FastifyRequest

    // Add items to guest cart
    await CartService.syncAnonymousCartToCustomer(
      'temp_customer_owner',
      identity.profile.id,
    )

    // 3. Perform merge
    let mergeCookieCall: CookieCallRecord | null = null
    const mockMergeReply = {
      setCookie: (name: string, val: string, opts: Record<string, unknown>) => {
        mergeCookieCall = { name, val, opts }
      },
    } as unknown as FastifyReply

    const result = await PersonalizationIdentityService.mergeAnonymousSession(
      'cust_real',
      reqVisitor,
      mockMergeReply,
    )

    expect(result.success).toBe(true)
    expect(result.merged).toBe(true)
    expect(mergeCookieCall!.val).not.toBe(issuedSignedCookie) // Cookie rotated!

    // Second call with same token returns merged: false (idempotent)
    const repeatResult =
      await PersonalizationIdentityService.mergeAnonymousSession(
        'cust_real',
        reqVisitor,
        mockMergeReply,
      )
    expect(repeatResult.success).toBe(true)
    expect(repeatResult.merged).toBe(false)
  })
})
