import { z } from "zod";
import {
  atLeastOneField,
  objectIdSchema,
  paginationSchema,
} from "../../shared/validators/common.js";
import { PERMISSION_KEY_PATTERN } from "../../shared/utils/slug.js";

export const listPermissionsQuerySchema = paginationSchema.extend({
  moduleId: objectIdSchema.optional(),
});

export const createPermissionSchema = z.object({
  key: z
    .string()
    .trim()
    .regex(PERMISSION_KEY_PATTERN, "Must be a dotted permission key (e.g. module.operation)")
    .max(160),
  name: z.string().trim().min(1, "Name is required").max(160),
  description: z.string().trim().max(500).optional(),
  moduleId: objectIdSchema,
  operationId: objectIdSchema,
});

export const updatePermissionSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(160).optional(),
    description: z.string().trim().max(500).optional(),
    active: z.boolean().optional(),
  })
  .refine(atLeastOneField, { message: "At least one field is required" });