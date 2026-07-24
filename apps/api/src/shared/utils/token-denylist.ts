import { redisClient } from "../../infrastructure/redis/redis";
import { prisma } from "../../infrastructure/database/prisma";

/**
 * Prefix used for revoked JWT IDs stored in Redis.
 */
const REDIS_JTI_PREFIX = "revoked_jti:";

/**
 * Adds a JWT ID (jti) to the denylist so that access tokens using this ID
 * are immediately rejected during verification.
 *
 * Stores in Redis (with automatic TTL matching token expiration) when available,
 * and persists to PostgreSQL `revoked_tokens` table for audit/durability.
 *
 * @param jti The unique JWT ID claim to revoke
 * @param expiresAt The timestamp when the original token naturally expires
 *
 * @security SD-003, SESSION_AND_TOKEN_SECURITY.md
 */
export async function revokeJti(jti: string, expiresAt: Date): Promise<void> {
  const ttlSeconds = Math.max(
    1,
    Math.ceil((expiresAt.getTime() - Date.now()) / 1000),
  );

  // 1. Store in Redis if available (sub-millisecond revocation lookup)
  if (redisClient) {
    try {
      await redisClient.set(`${REDIS_JTI_PREFIX}${jti}`, "1", "EX", ttlSeconds);
    } catch (err) {
      console.error("[DENYLIST] Erro ao registrar jti no Redis:", err);
    }
  }

  // 2. Persist in PostgreSQL database for durability and fallback
  try {
    await prisma.revokedToken.upsert({
      where: { jti },
      update: {},
      create: { jti, expiresAt },
    });
  } catch (err) {
    console.error("[DENYLIST] Erro ao registrar jti no PostgreSQL:", err);
  }
}

/**
 * Checks whether a given JWT ID (jti) has been revoked.
 *
 * Returns `true` if revoked, `false` otherwise.
 * First checks Redis if available, then falls back to PostgreSQL.
 *
 * @param jti The unique JWT ID claim to check
 */
export async function isJtiRevoked(jti: string): Promise<boolean> {
  // 1. Check Redis first for fast path
  if (redisClient) {
    try {
      const exists = await redisClient.exists(`${REDIS_JTI_PREFIX}${jti}`);
      if (exists === 1) return true;
    } catch (err) {
      console.error(
        "[DENYLIST] Erro ao consultar jti no Redis, fallback para DB:",
        err,
      );
    }
  }

  // 2. Fallback to PostgreSQL
  try {
    const revoked = await prisma.revokedToken.findUnique({
      where: { jti },
      select: { jti: true },
    });
    return !!revoked;
  } catch (err) {
    console.error("[DENYLIST] Erro ao consultar jti no PostgreSQL:", err);
    return false;
  }
}
