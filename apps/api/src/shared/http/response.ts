import { PaginationMeta } from "@verttex/types";

export function formatSuccessResponse<T>(data: T) {
  return {
    success: true as const,
    data,
  };
}

export function formatPaginatedResponse<T>(data: T[], meta: PaginationMeta) {
  return {
    success: true as const,
    data,
    meta,
  };
}
