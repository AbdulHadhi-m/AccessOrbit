import { z } from "zod";
import { USER_STATUSES } from "../../database/models/index.js";
import {
  atLeastOneField,
  objectIdSchema,
  paginationSchema,
} from "../../shared/validators/common.js";

export const listUsersQuerySchema = paginationSchema.extend({
  status: z.enum(USER_STATUSES).optional(),
});

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("A valid email is required").max(254),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  roleIds: z.array(objectIdSchema).max(20).optional(),
});

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(120).optional(),
    email: z.string().trim().email("A valid email is required").max(254).optional(),
    status: z.enum(USER_STATUSES).optional(),
  })
  .refine(atLeastOneField, { message: "At least one field is required" });

export const setUserRolesSchema = z.object({
  roleIds: z.array(objectIdSchema).min(1, "At least one role is required").max(20),
});