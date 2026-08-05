import { z } from "zod";

export const discoveryQuerySchema = z.object({
  page: z.coerce
    .number()
    .min(1, "A página deve ser maior ou igual a 1")
    .max(500, "Página máxima permitida é 500")
    .optional()
    .default(1),
  perPage: z.coerce
    .number()
    .min(1, "perPage deve ser no mínimo 1")
    .max(100, "perPage deve ser no máximo 100")
    .optional()
    .default(50),

  search: z
    .string()
    .transform((val) => (val ? val.trim().slice(0, 200) : undefined))
    .optional(),
  query: z
    .string()
    .transform((val) => (val ? val.trim().slice(0, 200) : undefined))
    .optional(),
  categorySlug: z
    .string()
    .transform((val) => (val ? val.trim().slice(0, 200) : undefined))
    .optional(),
  categoryId: z.string().optional(),
  brandSlug: z
    .string()
    .transform((val) => (val ? val.trim().slice(0, 200) : undefined))
    .optional(),
  brandId: z.string().optional(),
  storeSlug: z
    .string()
    .transform((val) => (val ? val.trim().slice(0, 200) : undefined))
    .optional(),
  storeId: z.string().optional(),
  minPrice: z.coerce
    .number()
    .min(0, "Preço mínimo não pode ser negativo")
    .max(1000000, "Preço mínimo excede o limite máximo permitido")
    .optional(),
  maxPrice: z.coerce
    .number()
    .min(0, "Preço máximo não pode ser negativo")
    .max(1000000, "Preço máximo excede o limite máximo permitido")
    .optional(),
  isFeatured: z
    .union([z.boolean(), z.string()])
    .transform((val) => val === true || val === "true")
    .optional(),
  isOffer: z
    .union([z.boolean(), z.string()])
    .transform((val) => val === true || val === "true")
    .optional(),
  sort: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val === "relevancia" || val === "relevance" || val === "featured") {
        return "relevance";
      }
      if (val === "menor-preco" || val === "price_asc") return "price_asc";
      if (val === "maior-preco" || val === "price_desc") return "price_desc";
      if (val === "mais-novos" || val === "newest") return "newest";
      return "relevance";
    })
    .default("relevance"),
  attributes: z.record(z.union([z.string(), z.array(z.string())])).optional(),
});

export type DiscoveryQuery = z.infer<typeof discoveryQuerySchema>;
