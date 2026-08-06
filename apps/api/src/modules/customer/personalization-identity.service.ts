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
   * If customer is authenticated, returns Customer Profile.
   * If anonymous, returns Visitor Profile (handling cookie validation, revocation and issuance).
   */
  static async resolveProfileFromRequest(
    req: FastifyRequest,
    reply?: FastifyReply,
  ): Promise<ResolvedIdentity> {
    const customerId = req.customerPayload?.id || req.customer?.id

    if (customerId) {
      let profile = await prisma.personalizationProfile.findUnique({
        where: { customerId },
      })

      if (!profile) {
        profile = await prisma.personalizationProfile.create({
          data: {
            customerId,
            personalizationEnabled: true,
            lastSeenAt: new Date(),
          },
        })
      } else {
        await prisma.personalizationProfile.update({
          where: { id: profile.id },
          data: { lastSeenAt: new Date() },
        })
      }

      return {
        profile,
        isCustomer: true,
        customerId,
      }
    }

    // Anonymous visitor resolution
    const cookieValue = req.cookies[VISITOR_COOKIE_NAME]
    const verifiedRawToken = this.verifyVisitorToken(cookieValue)
    const now = new Date()

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
   * Executed inside a single Prisma transaction with full rollback.
   * Always rotates visitor cookie after execution.
   */
  static async mergeAnonymousSession(
    customerId: string,
    req: FastifyRequest,
    reply?: FastifyReply,
  ): Promise<{ success: boolean; merged: boolean }> {
    const rawToken = this.verifyVisitorToken(req.cookies[VISITOR_COOKIE_NAME])

    let merged = false

    if (rawToken) {
      const visitorKeyHash = this.hashVisitorTokenForStorage(rawToken)

      merged = await prisma.$transaction(async (tx) => {
        // 1. Atomic claim of anonymous profile inside transaction
        const visitorProfile = await tx.personalizationProfile.findUnique({
          where: { visitorKeyHash },
        })

        if (!visitorProfile || visitorProfile.customerId) {
          return false
        }

        // 2. Consume/delete identity inside transaction to prevent concurrent reuse
        await tx.personalizationProfile.delete({
          where: { id: visitorProfile.id },
        })

        // 3. Sync guest cart inside transaction (marks cart completed even when empty)
        await CartService.syncAnonymousCartToCustomer(
          customerId,
          visitorProfile.id,
          tx,
        )

        // 4. Concurrency-safe customer profile creation/update inside transaction
        let customerProfile = await tx.personalizationProfile.findUnique({
          where: { customerId },
        })

        if (!customerProfile) {
          customerProfile = await tx.personalizationProfile.create({
            data: {
              customerId,
              personalizationEnabled: true,
              lastSeenAt: new Date(),
            },
          })
        } else {
          await tx.personalizationProfile.update({
            where: { id: customerProfile.id },
            data: { lastSeenAt: new Date() },
          })
        }

        // 5. Audit log (sanitized, no tokens, no cookies, no user ID mismatch)
        await logAudit({
          userId: null,
          action: 'MERGE_ANONYMOUS_SESSION',
          entity: 'Customer',
          entityId: customerId,
          newValues: { merged: true },
          req,
        })

        return true
      })
    } else {
      // Ensure customer profile exists even when no visitor cookie present
      const customerProfile = await prisma.personalizationProfile.findUnique({
        where: { customerId },
      })

      if (!customerProfile) {
        await prisma.personalizationProfile.create({
          data: {
            customerId,
            personalizationEnabled: true,
            lastSeenAt: new Date(),
          },
        })
      }
    }

    // Always issue a fresh rotated visitor cookie on success
    if (reply) {
      const freshRawToken = this.generateRawVisitorToken()
      this.setVisitorCookie(reply, freshRawToken)
    }

    return {
      success: true,
      merged,
    }
  }
}
