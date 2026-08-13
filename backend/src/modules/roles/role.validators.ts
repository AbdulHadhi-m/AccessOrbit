import { z } from "zod";
import {
  atLeastOneField,
  objectIdSchema,
  paginationSchema,
} from "../../shared/validators/common.js";
import { PERMISSION_KEY_PATTERN } from "../../shared/utils/slug.js";

export const listRolesQuerySchema = paginationSchema;

export const createRoleSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().trim().max(500).optional(),
  permissionKeys: z.array(z.string().regex(PERMISSION_KEY_PATTERN)).max(200).optional(),
});

export const updateRoleSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(120).optional(),
    description: z.string().trim().max(500).optional(),
    active: z.boolean().optional(),
  })
  .refine(atLeastOneField, { message: "At least one field is required" });

export const assignPermissionSchema = z.object({
  permissionKey: z
    .string()
    .trim()
    .regex(PERMISSION_KEY_PATTERN, "Must be a valid permission key"),
});

export const rolePermissionIdParamSchema = z.object({
  id: objectIdSchema,
  permissionId: objectIdSchema,
});