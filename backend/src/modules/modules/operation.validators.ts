import { z } from "zod";
import {
  atLeastOneField,
  objectIdSchema,
  paginationSchema,
} from "../../shared/validators/common.js";
import { KEBAB_KEY_PATTERN } from "../../shared/utils/slug.js";

export const listOperationsQuerySchema = paginationSchema.extend({
  moduleId: objectIdSchema.optional(),
  subModuleId: objectIdSchema.optional(),
});

export const createOperationSchema = z.object({
  moduleId: objectIdSchema,
  subModuleId: objectIdSchema.nullable().optional(),
  key: z
    .string()
    .trim()
    .regex(KEBAB_KEY_PATTERN, "Must be a lowercase kebab-case key")
    .max(60),
  name: z.string().trim().min(1, "Name is required").max(120),
  order: z.coerce.number().int().min(0).max(9999).optional(),
});

export const updateOperationSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(120).optional(),
    order: z.coerce.number().int().min(0).max(9999).optional(),
    active: z.boolean().optional(),
  })
  .refine(atLeastOneField, { message: "At least one field is required" });