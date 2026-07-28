import { describe, expect, it, vi, beforeEach } from "vitest";
import { isValidGtin } from "../../shared/utils/barcode-validator";
import { ProductsService } from "./products.service";
import { prisma } from "../../infrastructure/database/prisma";

vi.mock("../../infrastructure/database/prisma", () => ({
  prisma: {
    store: {
      findFirst: vi.fn(),
    },
    category: {
      findFirst: vi.fn(),
    },
    product: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    productOption: {
      create: vi.fn(),
    },
    productOptionValue: {
      create: vi.fn(),
    },
    productVariation: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    productVariationValue: {
      create: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

vi.mock("../../shared/utils/audit", () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

describe("Variant Integrity & GTIN Validation Tests (Fase 1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GS1 GTIN/EAN Modulo 10 Barcode Validation", () => {
    it("should accept valid EAN-13 barcodes with correct checksum", () => {
      expect(isValidGtin("7891000100103")).toBe(true);
      expect(isValidGtin("7891234567895")).toBe(true);
    });

    it("should accept valid EAN-8 and GTIN-14 barcodes", () => {
      expect(isValidGtin("96385074")).toBe(true);
      expect(isValidGtin("17891234567892")).toBe(true);
    });

    it("should accept null or empty barcodes as optional", () => {
      expect(isValidGtin(null)).toBe(true);
      expect(isValidGtin("")).toBe(true);
      expect(isValidGtin(undefined)).toBe(true);
    });

    it("should reject invalid barcode lengths or bad checksums", () => {
      expect(isValidGtin("7891000100100")).toBe(false); // bad check digit
      expect(isValidGtin("12345")).toBe(false); // bad length
      expect(isValidGtin("abc1234567890")).toBe(false); // non-digits
    });
  });

  describe("Product Variation Integrity", () => {
    it("should throw error if simple product has invalid GTIN/EAN", async () => {
      vi.mocked(prisma.store.findFirst).mockResolvedValue({ id: "store-1" } as any);
      vi.mocked(prisma.category.findFirst).mockResolvedValue({ id: "cat-1" } as any);

      await expect(
        ProductsService.createProduct(
          {
            storeId: "store-1",
            categoryId: "cat-1",
            name: "Queijo Teste",
            type: "simple",
            status: "active",
            isPublished: false,
            isFeatured: false,
            price: 50.0,
            barcode: "1234567890123", // invalid GTIN checksum
          } as any,
          "user-1",
        ),
      ).rejects.toThrow("Código de barras GTIN/EAN inválido");
    });

    it("should throw error if variable product contains duplicate option combinations", async () => {
      vi.mocked(prisma.store.findFirst).mockResolvedValue({ id: "store-1" } as any);
      vi.mocked(prisma.category.findFirst).mockResolvedValue({ id: "cat-1" } as any);

      await expect(
        ProductsService.createProduct(
          {
            storeId: "store-1",
            categoryId: "cat-1",
            name: "Camiseta Verttex",
            type: "variable",
            status: "active",
            isPublished: false,
            isFeatured: false,
            options: [
              { name: "Cor", values: ["Azul", "Preto"] },
              { name: "Tamanho", values: ["M"] },
            ],
            variations: [
              {
                sku: "TSHIRT-BLU-M-1",
                price: 79.9,
                optionValues: { Cor: "Azul", Tamanho: "M" },
              },
              {
                sku: "TSHIRT-BLU-M-2", // Duplicate option combination
                price: 79.9,
                optionValues: { Cor: "Azul", Tamanho: "M" },
              },
            ],
          } as any,
          "user-1",
        ),
      ).rejects.toThrow("Combinação de opções duplicada encontrada");
    });

    it("should resolve effective fiscal data inheriting from parent product when variation values are null", async () => {
      vi.mocked(prisma.productVariation.findUnique).mockResolvedValue({
        id: "var-1",
        ncm: null,
        cest: null,
        fiscalOrigin: null,
        commercialUnit: null,
        taxableUnit: null,
        product: {
          ncm: "0406.90.10",
          cest: "17.001.00",
          fiscalOrigin: 0,
          commercialUnit: "KG",
          taxableUnit: "KG",
        },
      } as any);

      const fiscalData = await ProductsService.resolveEffectiveFiscalData("var-1");

      expect(fiscalData).toEqual({
        ncm: "0406.90.10",
        cest: "17.001.00",
        fiscalOrigin: 0,
        commercialUnit: "KG",
        taxableUnit: "KG",
      });
    });

    it("should allow variation to override parent product fiscal data", async () => {
      vi.mocked(prisma.productVariation.findUnique).mockResolvedValue({
        id: "var-2",
        ncm: "8471.60.52",
        cest: "21.002.00",
        fiscalOrigin: 1,
        commercialUnit: "UN",
        taxableUnit: "UN",
        product: {
          ncm: "0406.90.10",
          cest: "17.001.00",
          fiscalOrigin: 0,
          commercialUnit: "KG",
          taxableUnit: "KG",
        },
      } as any);

      const fiscalData = await ProductsService.resolveEffectiveFiscalData("var-2");

      expect(fiscalData).toEqual({
        ncm: "8471.60.52",
        cest: "21.002.00",
        fiscalOrigin: 1,
        commercialUnit: "UN",
        taxableUnit: "UN",
      });
    });
  });
});
