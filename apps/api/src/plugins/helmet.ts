import fp from "fastify-plugin";
import helmet from "@fastify/helmet";

/**
 * Configures HTTP security headers for the Fastify API.
 *
 * Headers applied:
 * - Strict-Transport-Security (HSTS): enforces HTTPS in production
 * - X-Content-Type-Options: nosniff — prevents MIME sniffing
 * - X-Frame-Options: SAMEORIGIN — mitigates clickjacking
 * - Referrer-Policy: strict-origin-when-cross-origin
 * - X-DNS-Prefetch-Control: off
 * - Cross-Origin-Opener-Policy: same-origin
 * - Cross-Origin-Resource-Policy: same-origin
 *
 * Content-Security-Policy is intentionally NOT set here because this is a
 * pure JSON API. CSP headers are applied on the Next.js frontend apps
 * (Manager and Marketplace) via next.config.ts.
 *
 * @security SECURITY_ARCHITECTURE.md — Camada 2 (Servidor HTTP)
 */
export const helmetPlugin = fp(async (app) => {
  const isProduction = process.env.NODE_ENV === "production";

  await app.register(helmet, {
    // Enforce HTTPS for 1 year in production (with subdomains and preload)
    hsts: isProduction
      ? {
          maxAge: 31536000, // 1 year in seconds
          includeSubDomains: true,
          preload: true,
        }
      : false,

    // Prevent MIME type sniffing
    noSniff: true,

    // Clickjacking protection — API responses are not embedded, but protects error pages
    frameguard: { action: "sameorigin" },

    // Control referrer information sent with requests
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },

    // Disable DNS prefetching
    dnsPrefetchControl: { allow: false },

    // Cross-origin isolation — prevent cross-origin window interactions
    crossOriginOpenerPolicy: { policy: "same-origin" },

    // Prevent cross-origin resource embedding
    crossOriginResourcePolicy: { policy: "same-origin" },

    // Do not set Content-Security-Policy on the API — set it on frontends only
    contentSecurityPolicy: false,

    // X-Powered-By is already hidden by Fastify by default
    hidePoweredBy: false,

    // X-Download-Options: IE-specific header — less relevant for APIs
    ieNoOpen: false,

    // Permissions-Policy: restrict browser features
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
  });
});
