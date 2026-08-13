import { Router } from "express";
import { validate } from "../../shared/middleware/validate.js";
import { idParamSchema } from "../../shared/validators/common.js";
import { requireAuth } from "../auth/require-auth.js";
import { requirePermission } from "../authorization/require-permission.js";
import {
  createUser,
  deleteUser,
  getUser,
  listUsers,
  setUserRoles,
  updateUser,
} from "./user.controller.js";
import {
  createUserSchema,
  listUsersQuerySchema,
  setUserRolesSchema,
  updateUserSchema,
} from "./user.validators.js";

export const userRouter = Router();

userRouter.get(
  "/",
  requireAuth,
  requirePermission("rbac.users.view"),
  validate(listUsersQuerySchema, "query"),
  listUsers
);

userRouter.get(
  "/:id",
  requireAuth,
  requirePermission("rbac.users.view"),
  validate(idParamSchema, "params"),
  getUser
);

userRouter.post(
  "/",
  requireAuth,
  requirePermission("rbac.users.create"),
  validate(createUserSchema),
  createUser
);

userRouter.patch(
  "/:id",
  requireAuth,
  requirePermission("rbac.users.update"),
  validate(idParamSchema, "params"),
  validate(updateUserSchema),
  updateUser
);

userRouter.post(
  "/:id/roles",
  requireAuth,
  requirePermission("rbac.users.assign-roles"),
  validate(idParamSchema, "params"),
  validate(setUserRolesSchema),
  setUserRoles
);

userRouter.delete(
  "/:id",
  requireAuth,
  requirePermission("rbac.users.delete"),
  validate(idParamSchema, "params"),
  deleteUser
);