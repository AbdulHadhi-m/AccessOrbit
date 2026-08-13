import { z } from "zod";
import {
  atLeastOneField,
  paginationSchema,
} from "../../shared/validators/common.js";
import { KEBAB_KEY_PATTERN } from "../../shared/utils/slug.js";

export const listModulesQuerySchema = paginationSchema;

export const createModuleSchema = z.object({
  key: z
    .string()
    .trim()
    .regex(KEBAB_KEY_PATTERN, "Must be a lowercase kebab-case key")
    .max(60),
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().trim().max(500).optional(),
  order: z.coerce.number().int().min(0).max(9999).optional(),
  icon: z.string().trim().max(64).optional(),
});

export const updateModuleSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(120).optional(),
    description: z.string().trim().max(500).optional(),
    order: z.coerce.number().int().min(0).max(9999).optional(),
    icon: z.string().trim().max(64).optional(),
    active: z.boolean().optional(),
  })
  .refine(atLeastOneField, { message: "At least one field is required" });