import { describe, it, expect } from "vitest";
import { isJtiRevoked, revokeJti } from "./token-denylist";

describe("Token Denylist & Security Claims (jti)", () => {
  it("should return false for unrevoked jti", async () => {
    const isRevoked = await isJtiRevoked("non-existent-jti-uuid");
    expect(isRevoked).toBe(false);
  });

  it("should revoke a jti and confirm it is rejected", async () => {
    const jti = `test-jti-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 60 * 1000);

    await revokeJti(jti, expiresAt);
    const isRevoked = await isJtiRevoked(jti);

    expect(isRevoked).toBe(true);
  });
});
