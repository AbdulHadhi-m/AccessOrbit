export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function paginationMeta(total: number, page: number, limit: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
}

export function parseSort(raw: unknown, allowedFields: string[]): Record<string, 1 | -1> {
  const source = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const field = typeof source.sort === "string" ? source.sort.trim() : "";
  const direction = source.order === "desc" ? -1 : 1;
  if (!allowedFields.includes(field)) {
    return { createdAt: -1 };
  }
  return { [field]: direction };
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function toCaseInsensitiveRegex(value: string): RegExp {
  return new RegExp(escapeRegExp(value.trim()), "i");
}