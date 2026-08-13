import { z } from "zod";

export const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

export const objectIdSchema = z
  .string()
  .regex(OBJECT_ID_PATTERN, "Must be a valid 24-character id");

export const idParamSchema = z.object({
  id: objectIdSchema,
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
  sort: z.string().trim().max(50).optional(),
  order: z.enum(["asc", "desc"]).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export function atLeastOneField<T extends Record<string, unknown>>(value: T): boolean {
  return Object.keys(value).length > 0;
}