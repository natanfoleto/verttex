import { describe, it, expect, vi, beforeEach } from "vitest";
import { logAudit, sanitizeAuditData } from "./audit";
import { prisma } from "../../infrastructure/database/prisma";

vi.mock("../../infrastructure/database/prisma", () => ({
  prisma: {
    auditLog: {
      create: vi.fn().mockResolvedValue({ id: "audit-log-1" }),
    },
  },
}));

describe("LOG-001: Audit Log Sanitization & Sensitive Data Protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should recursively redact sensitive fields such as password, token, creditcard with [PROTEGIDO]", () => {
    const rawData = {
      username: "johndoe",
      password: "MySecretPassword123!",
      nested: {
        newPassword: "BrandNewPassword!",
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        safeField: "KeepThisValue",
      },
      arrayData: [
        { creditCard: "1234-5678-9012-3456", cvv: "123" },
        { item: "Laptop" },
      ],
    };

    const sanitized = sanitizeAuditData(rawData);

    expect(sanitized).toEqual({
      username: "johndoe",
      password: "[PROTEGIDO]",
      nested: {
        newPassword: "[PROTEGIDO]",
        token: "[PROTEGIDO]",
        safeField: "KeepThisValue",
      },
      arrayData: [
        { creditCard: "[PROTEGIDO]", cvv: "[PROTEGIDO]" },
        { item: "Laptop" },
      ],
    });
  });

  it("should save sanitized oldValues and newValues when logAudit is called", async () => {
    await logAudit({
      userId: "user-123",
      action: "UPDATE_PROFILE",
      entity: "User",
      entityId: "user-123",
      oldValues: { passwordHash: "old_hash_string" },
      newValues: { passwordHash: "new_hash_string", name: "John Updated" },
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-123",
        action: "UPDATE_PROFILE",
        entity: "User",
        entityId: "user-123",
        oldValues: { passwordHash: "[PROTEGIDO]" },
        newValues: { passwordHash: "[PROTEGIDO]", name: "John Updated" },
      }),
    });
  });
});
