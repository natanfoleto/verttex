import { z } from "zod";

// Pagination Meta Schema
export const PaginationMetaSchema = z.object({
  page: z.number().int().positive(),
  perPage: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});

export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

// API Success Helpers
export function createApiSuccessSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
  });
}

export function createApiPaginatedSuccessSchema<T extends z.ZodTypeAny>(
  dataSchema: T,
) {
  return z.object({
    success: z.literal(true),
    data: z.array(dataSchema),
    meta: PaginationMetaSchema,
  });
}

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiPaginatedSuccess<T> = {
  success: true;
  data: T[];
  meta: PaginationMeta;
};

// API Error Schema
export const ApiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
    fieldErrors: z.record(z.array(z.string())).optional(),
    requestId: z.string(),
  }),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;
