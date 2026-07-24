import { z } from "zod";

export const productOptionSchema = z.object({
  name: z.string().min(1, "Nome da opção é obrigatório"),
  position: z.number().optional().default(0),
  values: z
    .array(z.string().min(1))
    .min(1, "A opção deve conter ao menos um valor"),
});

export const productVariationSchema = z.object({
  sku: z.string().min(2, "SKU é obrigatório"),
  barcode: z.string().optional().nullable(),
  price: z.number().positive("Preço deve ser maior que zero"),
  promotionalPrice: z.number().positive().optional().nullable(),
  costPrice: z.number().positive().optional().nullable(),
  isDefault: z.boolean().optional().default(false),
  status: z.enum(["active", "inactive"]).optional().default("active"),
  weight: z.number().optional().nullable(),
  width: z.number().optional().nullable(),
  height: z.number().optional().nullable(),
  length: z.number().optional().nullable(),
  position: z.number().optional().default(0),
  optionValues: z.record(z.string()).optional().default({}), // e.g. { "Sabor": "Meia Cura", "Peso": "500g" }
});

export const createProductBodySchema = z.object({
  storeId: z.string().min(1, "Loja vinculada é obrigatória"),
  categoryId: z.string().min(1, "Categoria é obrigatória"),
  brandId: z.string().optional().nullable(),
  name: z.string().min(2, "Nome do produto deve ter pelo menos 2 caracteres"),
  slug: z.string().optional(),
  shortDescription: z.string().optional().nullable(),
  fullDescription: z.string().optional().nullable(),
  type: z.enum(["simple", "variable"]).default("simple"),
  status: z.enum(["draft", "active", "inactive", "archived"]).default("draft"),
  isPublished: z.boolean().optional().default(false),
  isFeatured: z.boolean().optional().default(false),
  weight: z.number().optional().nullable(),
  width: z.number().optional().nullable(),
  height: z.number().optional().nullable(),
  length: z.number().optional().nullable(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),

  // Preço e SKU base (obrigatórios para produto simples)
  price: z.number().positive("Preço deve ser maior que zero").optional(),
  promotionalPrice: z.number().positive().optional().nullable(),
  costPrice: z.number().positive().optional().nullable(),
  sku: z.string().optional(),

  // Opções e variações (para produto variável)
  options: z.array(productOptionSchema).optional().default([]),
  variations: z.array(productVariationSchema).optional().default([]),

  // Mídias
  mediaFileIds: z.array(z.string()).optional().default([]),
  mainMediaFileId: z.string().optional().nullable(),
});

export type CreateProductBody = z.infer<typeof createProductBodySchema>;

export const updateProductBodySchema = createProductBodySchema
  .partial()
  .extend({
    storeId: z.string().optional(),
    categoryId: z.string().optional(),
  });

export type UpdateProductBody = z.infer<typeof updateProductBodySchema>;

export const productListQuerySchema = z.object({
  storeId: z.string().optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  search: z.string().optional(),
  status: z
    .enum(["draft", "active", "inactive", "archived", "all"])
    .optional()
    .default("all"),
  isPublished: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  isFeatured: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .optional()
    .default("1"),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .optional()
    .default("20"),
});

export type ProductListQuery = z.infer<typeof productListQuerySchema>;
