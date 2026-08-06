import crypto from 'node:crypto'

import { apiEnv } from '@verttex/env/api'
import { FastifyReply, FastifyRequest } from 'fastify'

import { prisma } from '../../infrastructure/database/prisma'
import { logAudit } from '../../shared/utils/audit'
import { CartService } from '../cart/cart.service'

export const VISITOR_COOKIE_NAME = 'vt_visitor'
export const VISITOR_COOKIE_TTL_SECONDS = 90 * 24 * 60 * 60 // 90 days

const COOKIE_SALT = 'verttex-visitor-cookie-v1'
const STORAGE_SALT = 'verttex-visitor-profile-v1'

export interface ResolvedIdentity {
  profile: {
    id: string
    customerId?: string | null
    visitorKeyHash?: string | null
    personalizationEnabled: boolean
  }
  isCustomer: boolean
  customerId?: string
  rawToken?: string
}

export class PersonalizationIdentityService {
  private static getSecretKey(): string {
    return apiEnv.COOKIE_SECRET
  }

  /**
   * Generates a cryptographically strong 256-bit random raw visitor token (64 hex characters)
   */
  static generateRawVisitorToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  /**
   * Signs a raw visitor token using HMAC-SHA-256 with domain separation
   */
  static signVisitorToken(rawToken: string): string {
    const hmac = crypto.createHmac('sha256', this.getSecretKey())
    hmac.update(`${COOKIE_SALT}:${rawToken}`)
    const signature = hmac.digest('hex')
    return `${rawToken}.${signature}`
  }

  /**
   * Verifies signed visitor token. Returns rawToken if signature is valid, null otherwise
   */
  static verifyVisitorToken(signedValue: string | undefined): string | null {
    if (!signedValue || typeof signedValue !== 'string') return null

    const parts = signedValue.split('.')
    if (parts.length !== 2) return null

    const [rawToken, signature] = parts
    if (!rawToken || !signature || rawToken.length !== 64) return null

    const expectedSignature = crypto
      .createHmac('sha256', this.getSecretKey())
      .update(`${COOKIE_SALT}:${rawToken}`)
      .digest('hex')

    const sigBuffer = Buffer.from(signature)
    const expectedBuffer = Buffer.from(expectedSignature)

    if (
      sigBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      return null
    }

    return rawToken
  }

  /**
   * Hashes raw token for database storage using HMAC-SHA-256 with domain separation.
   * Raw tokens are NEVER stored directly in the database.
   */
  static hashVisitorTokenForStorage(rawToken: string): string {
    return crypto
      .createHmac('sha256', this.getSecretKey())
      .update(`${STORAGE_SALT}:${rawToken}`)
      .digest('hex')
  }

  /**
   * Sets a fresh signed visitor cookie on reply with strict security attributes
   */
  static setVisitorCookie(reply: FastifyReply, rawToken: string) {
    const signedValue = this.signVisitorToken(rawToken)
    reply.setCookie(VISITOR_COOKIE_NAME, signedValue, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: VISITOR_COOKIE_TTL_SECONDS,
    })
  }

  /**
   * Resolves or creates a PersonalizationProfile for the request.
   * Uses upsert for concurrency safety.
   */
  static async resolveProfileFromRequest(
    req: FastifyRequest,
    reply?: FastifyReply,
  ): Promise<ResolvedIdentity> {
    const customerId = req.customerPayload?.id || req.customer?.id
    const now = new Date()

    if (customerId) {
      const profile = await prisma.personalizationProfile.upsert({
        where: { customerId },
        create: {
          customerId,
          personalizationEnabled: true,
          lastSeenAt: now,
        },
        update: {
          lastSeenAt: now,
        },
      })

      return {
        profile,
        isCustomer: true,
        customerId,
      }
    }

    // Anonymous visitor resolution
    const cookieValue = req.cookies[VISITOR_COOKIE_NAME]
    const verifiedRawToken = this.verifyVisitorToken(cookieValue)

    if (verifiedRawToken) {
      const existingHash = this.hashVisitorTokenForStorage(verifiedRawToken)
      const existingProfile = await prisma.personalizationProfile.findUnique({
        where: { visitorKeyHash: existingHash },
      })

      // Active visitor profile exists
      if (
        existingProfile &&
        !existingProfile.customerId &&
        (!existingProfile.expiresAt || existingProfile.expiresAt > now)
      ) {
        await prisma.personalizationProfile.update({
          where: { id: existingProfile.id },
          data: { lastSeenAt: now },
        })

        return {
          profile: existingProfile,
          isCustomer: false,
          rawToken: verifiedRawToken,
        }
      }
    }

    // Cookie missing, signature tampered, expired or revoked (consumed by merge):
    // MUST NOT reuse old token/hash! Issue BRAND NEW random token and profile!
    const newRawToken = this.generateRawVisitorToken()
    const newVisitorKeyHash = this.hashVisitorTokenForStorage(newRawToken)
    const expiresAt = new Date(
      now.getTime() + VISITOR_COOKIE_TTL_SECONDS * 1000,
    )

    const profile = await prisma.personalizationProfile.create({
      data: {
        visitorKeyHash: newVisitorKeyHash,
        personalizationEnabled: true,
        lastSeenAt: now,
        expiresAt,
      },
    })

    if (reply) {
      this.setVisitorCookie(reply, newRawToken)
    }

    return {
      profile,
      isCustomer: false,
      rawToken: newRawToken,
    }
  }

  /**
   * Merges an anonymous session into a logged-in customer profile safely, transactionally and idempotently.
   * Atomically claims identity using deleteMany(count === 1) and upsert for customer profile serialisation.
   * Transaction returns { merged: boolean, mergedItemCount: number }.
   */
  static async mergeAnonymousSession(
    customerId: string,
    req: FastifyRequest,
    reply?: FastifyReply,
  ): Promise<{ success: boolean; merged: boolean; mergedItemCount: number }> {
    const rawToken = this.verifyVisitorToken(req.cookies[VISITOR_COOKIE_NAME])

    let result = { merged: false, mergedItemCount: 0 }

    if (rawToken) {
      const visitorKeyHash = this.hashVisitorTokenForStorage(rawToken)

      result = await prisma.$transaction(async (tx) => {
        const now = new Date()

        // 1. Locate visitor profile by hash to obtain ID and check validity
        const visitorProfile = await tx.personalizationProfile.findUnique({
          where: { visitorKeyHash },
        })

        if (
          !visitorProfile ||
          visitorProfile.customerId ||
          (visitorProfile.expiresAt && visitorProfile.expiresAt <= now)
        ) {
          return { merged: false, mergedItemCount: 0 }
        }

        // 2. Atomic claim via deleteMany with strict conditions
        const deleted = await tx.personalizationProfile.deleteMany({
          where: {
            id: visitorProfile.id,
            visitorKeyHash,
            customerId: null,
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
        })

        if (deleted.count !== 1) {
          return { merged: false, mergedItemCount: 0 }
        }

        // 3. Establish/update customer profile inside tx BEFORE cart manipulation (serialisation point)
        await tx.personalizationProfile.upsert({
          where: { customerId },
          create: {
            customerId,
            personalizationEnabled: true,
            lastSeenAt: now,
          },
          update: {
            lastSeenAt: now,
          },
        })

        // 4. Sync guest cart inside tx (marks cart completed even when empty)
        const { mergedItemCount } =
          await CartService.syncAnonymousCartToCustomer(
            tx,
            customerId,
            visitorProfile.id,
          )

        // 5. Audit log (sanitized, no tokens, no cookies)
        await logAudit({
          userId: null,
          action: 'MERGE_ANONYMOUS_SESSION',
          entity: 'Customer',
          entityId: customerId,
          newValues: { merged: true, mergedItemCount },
          req,
        })

        return { merged: true, mergedItemCount }
      })
    } else {
      // Ensure customer profile exists via upsert even when no visitor cookie present
      await prisma.personalizationProfile.upsert({
        where: { customerId },
        create: {
          customerId,
          personalizationEnabled: true,
          lastSeenAt: new Date(),
        },
        update: {
          lastSeenAt: new Date(),
        },
      })
    }

    // Always issue a fresh rotated visitor cookie on success
    if (reply) {
      const freshRawToken = this.generateRawVisitorToken()
      this.setVisitorCookie(reply, freshRawToken)
    }

    return {
      success: true,
      merged: result.merged,
      mergedItemCount: result.mergedItemCount,
    }
  }
}
