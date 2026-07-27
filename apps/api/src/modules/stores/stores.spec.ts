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
});
