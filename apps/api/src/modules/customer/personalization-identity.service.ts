import crypto from 'node:crypto'

import { apiEnv } from '@verttex/env/api'
import { FastifyReply, FastifyRequest } from 'fastify'

import { prisma } from '../../infrastructure/database/prisma'
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
    return apiEnv.COOKIE_SECRET || apiEnv.JWT_SECRET || 'verttex-secret-key'
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
   * Resolves or creates a PersonalizationProfile for the request.
   * If customer is authenticated, returns Customer Profile.
   * If anonymous, returns Visitor Profile (handling cookie validation, issue and rotation).
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
    let rawToken = this.verifyVisitorToken(cookieValue)
    let shouldIssueCookie = false

    if (!rawToken) {
      rawToken = this.generateRawVisitorToken()
      shouldIssueCookie = true
    }

    const visitorKeyHash = this.hashVisitorTokenForStorage(rawToken)
    let profile = await prisma.personalizationProfile.findUnique({
      where: { visitorKeyHash },
    })

    const now = new Date()

    if (!profile || (profile.expiresAt && profile.expiresAt <= now)) {
      if (profile) {
        await prisma.personalizationProfile.delete({
          where: { id: profile.id },
        })
      }

      const expiresAt = new Date(
        now.getTime() + VISITOR_COOKIE_TTL_SECONDS * 1000,
      )
      profile = await prisma.personalizationProfile.create({
        data: {
          visitorKeyHash,
          personalizationEnabled: true,
          lastSeenAt: now,
          expiresAt,
        },
      })
      shouldIssueCookie = true
    } else {
      await prisma.personalizationProfile.update({
        where: { id: profile.id },
        data: { lastSeenAt: now },
      })
    }

    if (shouldIssueCookie && reply) {
      const signedValue = this.signVisitorToken(rawToken)
      reply.setCookie(VISITOR_COOKIE_NAME, signedValue, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: VISITOR_COOKIE_TTL_SECONDS,
      })
    }

    return {
      profile,
      isCustomer: false,
      rawToken,
    }
  }

  /**
   * Merges an anonymous session into a logged-in customer profile safely and idempotently.
   * Merges cart items, deletes/deactivates old visitor profile, and issues a fresh rotated visitor cookie.
   */
  static async mergeAnonymousSession(
    customerId: string,
    req: FastifyRequest,
    reply?: FastifyReply,
  ) {
    const rawToken = this.verifyVisitorToken(req.cookies[VISITOR_COOKIE_NAME])

    if (rawToken) {
      const visitorKeyHash = this.hashVisitorTokenForStorage(rawToken)
      const visitorProfile = await prisma.personalizationProfile.findUnique({
        where: { visitorKeyHash },
      })

      if (visitorProfile && !visitorProfile.customerId) {
        // Merge guest cart items into customer cart
        await CartService.syncAnonymousCartToCustomer(
          customerId,
          visitorProfile.id,
        )

        // Delete anonymous visitor profile to prevent cross-account leaks
        await prisma.personalizationProfile.delete({
          where: { id: visitorProfile.id },
        })
      }
    }

    // Ensure customer profile exists
    let customerProfile = await prisma.personalizationProfile.findUnique({
      where: { customerId },
    })

    if (!customerProfile) {
      customerProfile = await prisma.personalizationProfile.create({
        data: {
          customerId,
          personalizationEnabled: true,
          lastSeenAt: new Date(),
        },
      })
    }

    // Always issue a fresh rotated visitor cookie after login
    if (reply) {
      const freshRawToken = this.generateRawVisitorToken()
      const signedValue = this.signVisitorToken(freshRawToken)
      reply.setCookie(VISITOR_COOKIE_NAME, signedValue, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: VISITOR_COOKIE_TTL_SECONDS,
      })
    }

    return {
      success: true,
      merged: true,
    }
  }
}
