import fp from "fastify-plugin";
import rateLimit from "@fastify/rate-limit";
import { redisClient } from "../infrastructure/redis/redis";

/**
 * Global rate limit plugin for the Fastify API.
 *
 * Storage:
 * - Development/single-instance: in-memory (default if REDIS_URL is not set)
 * - Production/multi-instance: Redis (automatically enabled when REDIS_URL is configured)
 *
 * @security SECURITY_ARCHITECTURE.md — Camada 2 (Servidor HTTP)
 * @security RATE_LIMIT_MATRIX.md
 * @decision SD-004
 */
export const rateLimitPlugin = fp(async (app) => {
  await app.register(rateLimit, {
    global: false,
    redis: redisClient ?? undefined,
    addHeaders: {
      "x-ratelimit-limit": true,
      "x-ratelimit-remaining": true,
      "x-ratelimit-reset": true,
      "retry-after": true,
    },
    // Default error message when rate limit is exceeded
    errorResponseBuilder: (_req, context) => ({
      success: false,
      error: "RATE_LIMIT_EXCEEDED",
      message: `Muitas requisições. Tente novamente em ${Math.ceil(context.ttl / 1000)} segundo(s).`,
      retryAfter: Math.ceil(context.ttl / 1000),
    }),
    // Key generator: use IP by default (overridden per route as needed)
    keyGenerator: (req) => {
      // Respect X-Forwarded-For when trustProxy is configured on Fastify
      return req.ip;
    },
    // Bypass rate limiting during local development (NODE_ENV === 'development')
    // Rate limit remains 100% active in tests (NODE_ENV === 'test') and production (NODE_ENV === 'production')
    allowList: () => process.env.NODE_ENV === "development",
  });
});
