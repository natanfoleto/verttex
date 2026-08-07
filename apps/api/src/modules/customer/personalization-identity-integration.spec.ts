import { FastifyRequest } from 'fastify'
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import { prisma } from '../../infrastructure/database/prisma'
import { CartService } from '../cart/cart.service'
import {
  PersonalizationIdentityService,
  VISITOR_COOKIE_NAME,
} from './personalization-identity.service'

function assertSafeTestDatabase() {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Safety check failed: NODE_ENV is not "test"')
  }
  const testDbUrl = process.env.TEST_DATABASE_URL
  if (!testDbUrl) {
    throw new Error(
      'Safety check failed: TEST_DATABASE_URL environment variable is mandatory for running integration tests',
    )
  }
  if (!testDbUrl.includes('test') && !testDbUrl.includes('testing')) {
    throw new Error(
      'Safety check failed: TEST_DATABASE_URL must contain a "test" or "testing" marker in database name',
    )
  }
  if (
    process.env.DATABASE_URL &&
    process.env.DATABASE_URL === testDbUrl &&
    !process.env.ALLOW_TEST_DB_OVERRIDE
  ) {
    throw new Error(
      'Safety check failed: TEST_DATABASE_URL must be distinct from standard application DATABASE_URL',
    )
  }
}

describe('Personalization Identity Real PostgreSQL & Redis Integration Suite (Push 1E Spec)', () => {
  let testStoreId: string
  let testCategoryId: string
  let testProductId: string
  let testVariationId: string

  beforeAll(async () => {
    // Mandated destructive protection check
    assertSafeTestDatabase()

    // Clean database tables before integration suite
    await prisma.$executeRaw`TRUNCATE TABLE carts, cart_items, personalization_profiles, customers, customer_sessions, audit_logs, products, product_variations, categories, stores CASCADE`

    // Seed minimal required store, category, product and variation records
    const store = await prisma.store.create({
      data: {
        name: 'Integration Test Store',
        slug: `store-int-${Date.now()}`,
        status: 'active',
      },
    })
    testStoreId = store.id

    const category = await prisma.category.create({
      data: {
        name: 'Integration Category',
        slug: `cat-int-${Date.now()}`,
      },
    })
    testCategoryId = category.id

    const product = await prisma.product.create({
      data: {
        store: { connect: { id: testStoreId } },
        category: { connect: { id: testCategoryId } },
        name: 'Integration Product',
        slug: `prod-int-${Date.now()}`,
        shortDescription: 'Test product for integration suite',
        status: 'active',
      },
    })
    testProductId = product.id

    const variation = await prisma.productVariation.create({
      data: {
        product: { connect: { id: testProductId } },
        store: { connect: { id: testStoreId } },
        sku: `SKU-INT-${Date.now()}`,
        price: 100.0,
      },
    })
    testVariationId = variation.id
  })

  beforeEach(async () => {
    assertSafeTestDatabase()

    // Clean transactional data between tests
    await prisma.cartItem.deleteMany()
    await prisma.cart.deleteMany()
    await prisma.personalizationProfile.deleteMany()
    await prisma.customerSession.deleteMany()
    await prisma.customer.deleteMany()
    await prisma.auditLog.deleteMany()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  // --- 1. PostgreSQL Constraints Real Checks ---

  it('proves XOR constraint rejects both customerId and visitorKeyHash NULL in PostgreSQL', async () => {
    await expect(
      prisma.$executeRaw`INSERT INTO personalization_profiles (id, "personalizationEnabled", "lastSeenAt", "createdAt", "updatedAt") VALUES ('p_err_null', true, NOW(), NOW(), NOW())`,
    ).rejects.toThrow()
  })

  it('proves XOR constraint rejects both customerId and visitorKeyHash filled in PostgreSQL', async () => {
    const customer = await prisma.customer.create({
      data: {
        name: 'XOR Test Customer',
        email: `xor-both-${Date.now()}@example.com`,
        passwordHash: 'hash',
      },
    })

    await expect(
      prisma.$executeRaw`INSERT INTO personalization_profiles (id, "customerId", "visitorKeyHash", "personalizationEnabled", "lastSeenAt", "createdAt", "updatedAt") VALUES ('p_err_both', ${customer.id}, 'hash_xor_val', true, NOW(), NOW(), NOW())`,
    ).rejects.toThrow()
  })

  it('proves XOR constraint accepts valid customer profile and valid visitor profile', async () => {
    const customer = await prisma.customer.create({
      data: {
        name: 'XOR Valid Customer',
        email: `xor-valid-${Date.now()}@example.com`,
        passwordHash: 'hash',
      },
    })

    const customerProfile = await prisma.personalizationProfile.create({
      data: { customerId: customer.id },
    })
    expect(customerProfile.customerId).toBe(customer.id)
    expect(customerProfile.visitorKeyHash).toBeNull()

    const visitorProfile = await prisma.personalizationProfile.create({
      data: { visitorKeyHash: `unique_hash_${Date.now()}` },
    })
    expect(visitorProfile.visitorKeyHash).toBeDefined()
    expect(visitorProfile.customerId).toBeNull()
  })

  it('proves partial unique index rejects two active carts for the same customerId', async () => {
    const customer = await prisma.customer.create({
      data: {
        name: 'Cart Customer',
        email: `cart-dupe-${Date.now()}@example.com`,
        passwordHash: 'hash',
      },
    })

    await prisma.cart.create({
      data: { customerId: customer.id, status: 'active' },
    })

    await expect(
      prisma.cart.create({
        data: { customerId: customer.id, status: 'active' },
      }),
    ).rejects.toThrow()
  })

  it('proves partial unique index rejects two active carts for the same sessionId', async () => {
    const sessionId = `session_anon_unique_${Date.now()}`

    await prisma.cart.create({
      data: { sessionId, status: 'active' },
    })

    await expect(
      prisma.cart.create({
        data: { sessionId, status: 'active' },
      }),
    ).rejects.toThrow()
  })

  it('proves completed carts can exist alongside an active cart for the same customerId or sessionId', async () => {
    const customer = await prisma.customer.create({
      data: {
        name: 'Multi Cart Customer',
        email: `multi-cart-${Date.now()}@example.com`,
        passwordHash: 'hash',
      },
    })

    await prisma.cart.create({
      data: { customerId: customer.id, status: 'completed' },
    })
    const activeCart = await prisma.cart.create({
      data: { customerId: customer.id, status: 'active' },
    })

    expect(activeCart.status).toBe('active')
  })

  // --- 2. Real Merge & Rollback Integration ---

  it('handles empty anonymous cart cleanly', async () => {
    const customer = await prisma.customer.create({
      data: {
        name: 'Empty Cart Customer',
        email: `empty-cust-${Date.now()}@example.com`,
        passwordHash: 'hash',
      },
    })

    const rawToken = PersonalizationIdentityService.generateRawVisitorToken()
    const signedCookie =
      PersonalizationIdentityService.signVisitorToken(rawToken)
    const visitorHash =
      PersonalizationIdentityService.hashVisitorTokenForStorage(rawToken)

    const visitorProfile = await prisma.personalizationProfile.create({
      data: { visitorKeyHash: visitorHash },
    })

    // Empty guest cart with NO items created
    await prisma.cart.create({
      data: { sessionId: visitorProfile.id, status: 'active' },
    })

    const mockReq = {
      cookies: { [VISITOR_COOKIE_NAME]: signedCookie },
      headers: {},
      ip: '127.0.0.1',
    } as unknown as FastifyRequest

    const result = await PersonalizationIdentityService.mergeAnonymousSession(
      customer.id,
      mockReq,
    )

    expect(result.success).toBe(true)
    expect(result.merged).toBe(true)
    expect(result.mergedItemCount).toBe(0)
  })

  it('completes anonymous cart and transfers real items into customer cart', async () => {
    const customer = await prisma.customer.create({
      data: {
        name: 'Merge Customer',
        email: `merge-cust-${Date.now()}@example.com`,
        passwordHash: 'hash',
      },
    })

    const rawToken = PersonalizationIdentityService.generateRawVisitorToken()
    const signedCookie =
      PersonalizationIdentityService.signVisitorToken(rawToken)
    const visitorHash =
      PersonalizationIdentityService.hashVisitorTokenForStorage(rawToken)

    const visitorProfile = await prisma.personalizationProfile.create({
      data: { visitorKeyHash: visitorHash },
    })

    const guestCart = await prisma.cart.create({
      data: { sessionId: visitorProfile.id, status: 'active' },
    })
    await prisma.cartItem.create({
      data: {
        cartId: guestCart.id,
        variationId: testVariationId,
        storeId: testStoreId,
        quantity: 3,
        unitPrice: 100.0,
      },
    })

    const mockReq = {
      cookies: { [VISITOR_COOKIE_NAME]: signedCookie },
      headers: {},
      ip: '127.0.0.1',
    } as unknown as FastifyRequest

    const result = await PersonalizationIdentityService.mergeAnonymousSession(
      customer.id,
      mockReq,
    )

    expect(result.success).toBe(true)
    expect(result.merged).toBe(true)
    expect(result.mergedItemCount).toBe(1)

    // Guest cart marked completed
    const updatedGuestCart = await prisma.cart.findUnique({
      where: { id: guestCart.id },
    })
    expect(updatedGuestCart?.status).toBe('completed')

    // Customer active cart created with transferred quantity
    const customerCart = await prisma.cart.findFirst({
      where: { customerId: customer.id, status: 'active' },
      include: { items: true },
    })
    expect(customerCart).not.toBeNull()
    expect(customerCart?.items).toHaveLength(1)
    expect(customerCart?.items[0]?.quantity).toBe(3)
  })

  it('combines quantity of existing duplicate item in customer cart exactly once', async () => {
    const customer = await prisma.customer.create({
      data: {
        name: 'Combine Item Customer',
        email: `combine-${Date.now()}@example.com`,
        passwordHash: 'hash',
      },
    })

    const rawToken = PersonalizationIdentityService.generateRawVisitorToken()
    const signedCookie =
      PersonalizationIdentityService.signVisitorToken(rawToken)
    const visitorHash =
      PersonalizationIdentityService.hashVisitorTokenForStorage(rawToken)

    const visitorProfile = await prisma.personalizationProfile.create({
      data: { visitorKeyHash: visitorHash },
    })

    // Guest cart with 4 items
    const guestCart = await prisma.cart.create({
      data: { sessionId: visitorProfile.id, status: 'active' },
    })
    await prisma.cartItem.create({
      data: {
        cartId: guestCart.id,
        variationId: testVariationId,
        storeId: testStoreId,
        quantity: 4,
        unitPrice: 100.0,
      },
    })

    // Pre-existing customer cart with 2 items
    const customerCart = await prisma.cart.create({
      data: { customerId: customer.id, status: 'active' },
    })
    await prisma.cartItem.create({
      data: {
        cartId: customerCart.id,
        variationId: testVariationId,
        storeId: testStoreId,
        quantity: 2,
        unitPrice: 100.0,
      },
    })

    const mockReq = {
      cookies: { [VISITOR_COOKIE_NAME]: signedCookie },
      headers: {},
      ip: '127.0.0.1',
    } as unknown as FastifyRequest

    const result = await PersonalizationIdentityService.mergeAnonymousSession(
      customer.id,
      mockReq,
    )

    expect(result.merged).toBe(true)
    expect(result.mergedItemCount).toBe(1)

    const updatedCustomerItems = await prisma.cartItem.findMany({
      where: { cartId: customerCart.id },
    })
    expect(updatedCustomerItems).toHaveLength(1)
    expect(updatedCustomerItems[0]?.quantity).toBe(6) // 2 + 4 = 6
  })

  it('performs real database rollback on intermediate transaction failure', async () => {
    const customer = await prisma.customer.create({
      data: {
        name: 'Rollback Customer',
        email: `rollback-${Date.now()}@example.com`,
        passwordHash: 'hash',
      },
    })

    const rawToken = PersonalizationIdentityService.generateRawVisitorToken()
    const signedCookie =
      PersonalizationIdentityService.signVisitorToken(rawToken)
    const visitorHash =
      PersonalizationIdentityService.hashVisitorTokenForStorage(rawToken)

    const visitorProfile = await prisma.personalizationProfile.create({
      data: { visitorKeyHash: visitorHash },
    })

    const guestCart = await prisma.cart.create({
      data: { sessionId: visitorProfile.id, status: 'active' },
    })

    // Force an error inside syncAnonymousCartToCustomer
    const spy = vi
      .spyOn(CartService, 'syncAnonymousCartToCustomer')
      .mockImplementationOnce(async () => {
        throw new Error('Simulated failure during cart sync')
      })

    const mockReq = {
      cookies: { [VISITOR_COOKIE_NAME]: signedCookie },
      headers: {},
      ip: '127.0.0.1',
    } as unknown as FastifyRequest

    await expect(
      PersonalizationIdentityService.mergeAnonymousSession(
        customer.id,
        mockReq,
      ),
    ).rejects.toThrow('Simulated failure during cart sync')

    // Real DB verification: visitor profile still exists!
    const intactProfile = await prisma.personalizationProfile.findUnique({
      where: { id: visitorProfile.id },
    })
    expect(intactProfile).not.toBeNull()

    // Real DB verification: guest cart is still active!
    const intactCart = await prisma.cart.findUnique({
      where: { id: guestCart.id },
    })
    expect(intactCart?.status).toBe('active')

    // Real DB verification: audit log was NOT created!
    const auditLogs = await prisma.auditLog.findMany({
      where: { entityId: customer.id },
    })
    expect(auditLogs).toHaveLength(0)

    spy.mockRestore()
  })

  it('proves commit order: commit completes -> logAudit is called post-commit', async () => {
    const customer = await prisma.customer.create({
      data: {
        name: 'Audit Commit Customer',
        email: `audit-commit-${Date.now()}@example.com`,
        passwordHash: 'hash',
      },
    })

    const rawToken = PersonalizationIdentityService.generateRawVisitorToken()
    const signedCookie =
      PersonalizationIdentityService.signVisitorToken(rawToken)
    const visitorHash =
      PersonalizationIdentityService.hashVisitorTokenForStorage(rawToken)

    await prisma.personalizationProfile.create({
      data: { visitorKeyHash: visitorHash },
    })

    const mockReq = {
      cookies: { [VISITOR_COOKIE_NAME]: signedCookie },
      headers: {},
      ip: '127.0.0.1',
    } as unknown as FastifyRequest

    const result = await PersonalizationIdentityService.mergeAnonymousSession(
      customer.id,
      mockReq,
    )

    expect(result.merged).toBe(true)

    // Real audit log in PostgreSQL
    const auditLog = await prisma.auditLog.findFirst({
      where: { entityId: customer.id, action: 'SYSTEM_ACTION' },
    })
    expect(auditLog).not.toBeNull()
    expect(auditLog?.entity).toBe('Customer')
    const payload = auditLog?.newValues as { event?: string; merged?: boolean }
    expect(payload?.event).toBe('MERGE_ANONYMOUS_SESSION')
    expect(payload?.merged).toBe(true)
  })

  // --- 3. Real Concurrency with Promise.all ---

  it('handles concurrent merge calls for the same cookie with Promise.all', async () => {
    const customer = await prisma.customer.create({
      data: {
        name: 'Concurrent Customer',
        email: `concurrent-${Date.now()}@example.com`,
        passwordHash: 'hash',
      },
    })

    const rawToken = PersonalizationIdentityService.generateRawVisitorToken()
    const signedCookie =
      PersonalizationIdentityService.signVisitorToken(rawToken)
    const visitorHash =
      PersonalizationIdentityService.hashVisitorTokenForStorage(rawToken)

    const visitorProfile = await prisma.personalizationProfile.create({
      data: { visitorKeyHash: visitorHash },
    })

    const guestCart = await prisma.cart.create({
      data: { sessionId: visitorProfile.id, status: 'active' },
    })
    await prisma.cartItem.create({
      data: {
        cartId: guestCart.id,
        variationId: testVariationId,
        storeId: testStoreId,
        quantity: 5,
        unitPrice: 100.0,
      },
    })

    const mockReq = {
      cookies: { [VISITOR_COOKIE_NAME]: signedCookie },
      headers: {},
      ip: '127.0.0.1',
    } as unknown as FastifyRequest

    // Execute two concurrent merge operations in parallel
    const [res1, res2] = await Promise.all([
      PersonalizationIdentityService.mergeAnonymousSession(
        customer.id,
        mockReq,
      ),
      PersonalizationIdentityService.mergeAnonymousSession(
        customer.id,
        mockReq,
      ),
    ])

    // Exactly one operation merged, the other returned merged: false idempotently!
    const mergedCount = (res1.merged ? 1 : 0) + (res2.merged ? 1 : 0)
    expect(mergedCount).toBe(1)

    // Exactly ONE active customer cart in PostgreSQL
    const activeCarts = await prisma.cart.findMany({
      where: { customerId: customer.id, status: 'active' },
      include: { items: true },
    })
    expect(activeCarts).toHaveLength(1)
    expect(activeCarts[0]?.items[0]?.quantity).toBe(5)
  })

  it('handles concurrent merge calls for two visitors to same customer account with Promise.all', async () => {
    const customer = await prisma.customer.create({
      data: {
        name: 'Two Visitors Customer',
        email: `two-vis-${Date.now()}@example.com`,
        passwordHash: 'hash',
      },
    })

    // Visitor 1
    const rawToken1 = PersonalizationIdentityService.generateRawVisitorToken()
    const signedCookie1 =
      PersonalizationIdentityService.signVisitorToken(rawToken1)
    const hash1 =
      PersonalizationIdentityService.hashVisitorTokenForStorage(rawToken1)
    const profile1 = await prisma.personalizationProfile.create({
      data: { visitorKeyHash: hash1 },
    })
    const cart1 = await prisma.cart.create({
      data: { sessionId: profile1.id, status: 'active' },
    })
    await prisma.cartItem.create({
      data: {
        cartId: cart1.id,
        variationId: testVariationId,
        storeId: testStoreId,
        quantity: 2,
        unitPrice: 100.0,
      },
    })

    // Visitor 2
    const rawToken2 = PersonalizationIdentityService.generateRawVisitorToken()
    const signedCookie2 =
      PersonalizationIdentityService.signVisitorToken(rawToken2)
    const hash2 =
      PersonalizationIdentityService.hashVisitorTokenForStorage(rawToken2)
    const profile2 = await prisma.personalizationProfile.create({
      data: { visitorKeyHash: hash2 },
    })
    const cart2 = await prisma.cart.create({
      data: { sessionId: profile2.id, status: 'active' },
    })
    await prisma.cartItem.create({
      data: {
        cartId: cart2.id,
        variationId: testVariationId,
        storeId: testStoreId,
        quantity: 3,
        unitPrice: 100.0,
      },
    })

    const req1 = {
      cookies: { [VISITOR_COOKIE_NAME]: signedCookie1 },
      headers: {},
      ip: '127.0.0.1',
    } as unknown as FastifyRequest
    const req2 = {
      cookies: { [VISITOR_COOKIE_NAME]: signedCookie2 },
      headers: {},
      ip: '127.0.0.1',
    } as unknown as FastifyRequest

    const [res1, res2] = await Promise.all([
      PersonalizationIdentityService.mergeAnonymousSession(customer.id, req1),
      PersonalizationIdentityService.mergeAnonymousSession(customer.id, req2),
    ])

    expect(res1.merged).toBe(true)
    expect(res2.merged).toBe(true)

    // Sum exact: 2 + 3 = 5 items in exactly ONE active customer cart!
    const activeCarts = await prisma.cart.findMany({
      where: { customerId: customer.id, status: 'active' },
      include: { items: true },
    })
    expect(activeCarts).toHaveLength(1)
    expect(activeCarts[0]?.items[0]?.quantity).toBe(5)
  })

  it('handles simultaneous real merge (with guest cart item) and getOrCreateCart with Promise.all without unhandled P2002 (Push 1E Spec 2.3)', async () => {
    const customer = await prisma.customer.create({
      data: {
        name: 'Simultaneous Customer Spec 2.3',
        email: `simultaneous-23-${Date.now()}@example.com`,
        passwordHash: 'hash',
      },
    })

    // 1. Create valid visitor profile
    const rawToken = PersonalizationIdentityService.generateRawVisitorToken()
    const signedCookie =
      PersonalizationIdentityService.signVisitorToken(rawToken)
    const hash =
      PersonalizationIdentityService.hashVisitorTokenForStorage(rawToken)
    const visitorProfile = await prisma.personalizationProfile.create({
      data: { visitorKeyHash: hash },
    })

    // 2. Create session / guest cart with REAL item
    const guestCart = await prisma.cart.create({
      data: { sessionId: visitorProfile.id, status: 'active' },
    })
    await prisma.cartItem.create({
      data: {
        cartId: guestCart.id,
        variationId: testVariationId,
        storeId: testStoreId,
        quantity: 4,
        unitPrice: 100.0,
      },
    })

    // 3. Confirm customer does NOT have an active cart yet
    const preCart = await prisma.cart.findFirst({
      where: { customerId: customer.id, status: 'active' },
    })
    expect(preCart).toBeNull()

    const mockReq = {
      cookies: { [VISITOR_COOKIE_NAME]: signedCookie },
      headers: {},
      ip: '127.0.0.1',
    } as unknown as FastifyRequest

    // 4. Execute simultaneously with Promise.all: real merge and getOrCreateCart
    const [mergeRes, cartFromGetOrCreate] = await Promise.all([
      PersonalizationIdentityService.mergeAnonymousSession(
        customer.id,
        mockReq,
      ),
      CartService.getOrCreateCart({ customerId: customer.id }),
    ])

    // 5. Confirm results
    expect(mergeRes.success).toBe(true)
    expect(mergeRes.merged).toBe(true)
    expect(mergeRes.mergedItemCount).toBe(1)
    expect(cartFromGetOrCreate).toBeDefined()

    // Single active cart in PostgreSQL with item quantity 4 transferred exactly once!
    const activeCarts = await prisma.cart.findMany({
      where: { customerId: customer.id, status: 'active' },
      include: { items: true },
    })
    expect(activeCarts).toHaveLength(1)
    expect(activeCarts[0]?.items).toHaveLength(1)
    expect(activeCarts[0]?.items[0]?.quantity).toBe(4)
    expect(cartFromGetOrCreate.id).toBe(activeCarts[0]?.id)
  })
})
