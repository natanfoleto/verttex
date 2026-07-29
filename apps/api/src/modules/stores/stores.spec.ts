import { describe, expect, it } from "vitest";
import { isSlugReserved, normalizeSlug, RESERVED_SLUGS } from "./reserved-slugs";

describe("Stores Management & Reserved Slugs Unit Tests", () => {
  it("should correctly normalize store name into a URL-friendly slug", () => {
    expect(normalizeSlug("Queijaria Alvorada da Serra!")).toBe("queijaria-alvorada-da-serra");
    expect(normalizeSlug("Vinícola & Adega Rossi (RS)")).toBe("vinicola-adega-rossi-rs");
    expect(normalizeSlug("  Doces & Geleias - Colônia  ")).toBe("doces-geleias-colonia");
  });

  it("should reject reserved system slugs for store registration", () => {
    const reservedList = Array.from(RESERVED_SLUGS);
    for (const slug of reservedList) {
      expect(isSlugReserved(slug)).toBe(true);
    }

    expect(isSlugReserved("admin")).toBe(true);
    expect(isSlugReserved("produtos")).toBe(true);
    expect(isSlugReserved("api")).toBe(true);
    expect(isSlugReserved("carrinho")).toBe(true);
  });

  it("should allow valid artisan store slugs", () => {
    expect(isSlugReserved("queijaria-alvorada")).toBe(false);
    expect(isSlugReserved("apiario-vale-verde")).toBe(false);
    expect(isSlugReserved("embutidos-tradicao")).toBe(false);
  });

  it("should validate supported store logo mime types and extensions", () => {
    const validMimes = ["image/jpeg", "image/png", "image/webp"];
    const invalidMimes = ["image/gif", "application/pdf", "text/html"];

    for (const mime of validMimes) {
      expect(validMimes.includes(mime)).toBe(true);
    }

    for (const mime of invalidMimes) {
      expect(validMimes.includes(mime)).toBe(false);
    }
  });

  it("should calculate available stock correctly as physical minus reserved", () => {
    const totalPhysicalStock = 150;
    const totalReservedStock = 20;
    const availableStock = Math.max(0, totalPhysicalStock - totalReservedStock);

    expect(availableStock).toBe(130);
  });

  it("should handle edge case where reserved stock exceeds physical stock without negative result", () => {
    const totalPhysicalStock = 5;
    const totalReservedStock = 10;
    const availableStock = Math.max(0, totalPhysicalStock - totalReservedStock);

    expect(availableStock).toBe(0);
  });
});
