import { FastifyRequest } from "fastify";
import { prisma } from "../../infrastructure/database/prisma";

export interface AuditOptions {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  oldValues?: unknown;
  newValues?: unknown;
  req?: FastifyRequest | null;
}

/**
 * Fields that must never be persisted in plain text in audit logs.
 * They are replaced with the "[PROTEGIDO]" sentinel value.
 */
const SENSITIVE_KEYS = new Set([
  "password",
  "passwordhash",
  "currentpassword",
  "newpassword",
  "confirmpassword",
  "token",
  "accesstoken",
  "refreshtoken",
  "refreshtokenhash",
  "tokenhash",
  "secret",
  "apikey",
  "authorization",
  "cookie",
  "session",
  "creditcard",
  "cvv",
]);

/**
 * Recursively sanitizes an object by replacing sensitive field values
 * with the "[PROTEGIDO]" sentinel string.
 */
export function sanitizeAuditData(value: unknown): unknown {
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    return value.map(sanitizeAuditData);
  }

  if (typeof value === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        sanitized[key] = "[PROTEGIDO]";
      } else {
        sanitized[key] = sanitizeAuditData(val);
      }
    }
    return sanitized;
  }

  return value;
}

/**
 * Extracts the client IP address from a Fastify request.
 * Priority: x-forwarded-for (first IP) → x-real-ip → cf-connecting-ip → request.ip
 */
function extractIp(req: FastifyRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    if (raw) {
      const first = raw.split(",")[0]?.trim();
      if (first) return first;
    }
  }

  const realIp = req.headers["x-real-ip"];
  if (realIp) {
    return Array.isArray(realIp) ? (realIp[0] ?? req.ip) : realIp;
  }

  const cfIp = req.headers["cf-connecting-ip"];
  if (cfIp) {
    return Array.isArray(cfIp) ? (cfIp[0] ?? req.ip) : cfIp;
  }

  return req.ip || "127.0.0.1";
}

/**
 * Records an audit log entry.
 *
 * This function NEVER throws. Errors in audit recording are logged
 * internally but do not break the calling operation.
 *
 * @example
 * // User action
 * await logAudit({ userId: user.id, action: 'CREATE', entity: 'Store', entityId: store.id, newValues: store, req })
 *
 * @example
 * // System action (no user)
 * await logAudit({ action: 'SYSTEM_ACTION', entity: 'Store', entityId: store.id, newValues: { source: 'cron-job' } })
 */
export async function logAudit({
  userId,
  action,
  entity,
  entityId,
  oldValues,
  newValues,
  req,
}: AuditOptions): Promise<void> {
  try {
    const ipAddress = req ? extractIp(req) : null;
    const userAgent = req ? (req.headers["user-agent"] ?? null) : null;

    const sanitizedOld = oldValues ? sanitizeAuditData(oldValues) : null;
    const sanitizedNew = newValues ? sanitizeAuditData(newValues) : null;

    await prisma.auditLog.create({
      data: {
        userId: userId ?? null,
        action,
        entity,
        entityId: entityId ?? null,
        oldValues: sanitizedOld ? (sanitizedOld as any) : undefined,
        newValues: sanitizedNew ? (sanitizedNew as any) : undefined,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error("[AUDIT] Falha ao registrar log de auditoria:", {
      action,
      entity,
      entityId,
      error,
    });
    // Intentionally not re-throwing — audit must never break the main operation
  }
}
