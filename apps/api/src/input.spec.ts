import { describe, it, expect } from "vitest";
import { buildApp } from "./app";

describe("INPUT-001: Global Body Limit & Payload Flood Protection", () => {
  it("should reject payloads larger than 256 KB returning 413 Payload Too Large", async () => {
    const app = buildApp();
    await app.ready();

    // Create a 300 KB payload (exceeding 256 KB limit)
    const largePayload = {
      data: "A".repeat(300 * 1024),
    };

    const response = await app.inject({
      method: "POST",
      url: "/auth/users/forgot-password",
      payload: largePayload,
    });

    expect(response.statusCode).toBe(413);
    await app.close();
  });
});
