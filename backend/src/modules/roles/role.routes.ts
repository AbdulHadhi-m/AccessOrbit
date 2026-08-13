import { Router } from "express";
import { validate } from "../../shared/middleware/validate.js";
import { idParamSchema } from "../../shared/validators/common.js";
import { requireAuth } from "../auth/require-auth.js";
import { requirePermission } from "../authorization/require-permission.js";
import {
  assignPermission,
  createRole,
  deleteRole,
  getRole,
  listRolePermissions,
  listRoles,
  removePermission,
  updateRole,
} from "./role.controller.js";
import {
  assignPermissionSchema,
  createRoleSchema,
  listRolesQuerySchema,
  rolePermissionIdParamSchema,
  updateRoleSchema,
} from "./role.validators.js";

export const roleRouter = Router();

roleRouter.get(
  "/",
  requireAuth,
  requirePermission("rbac.roles.view"),
  validate(listRolesQuerySchema, "query"),
  listRoles
);

roleRouter.get(
  "/:id",
  requireAuth,
  requirePermission("rbac.roles.view"),
  validate(idParamSchema, "params"),
  getRole
);

roleRouter.post(
  "/",
  requireAuth,
  requirePermission("rbac.roles.create"),
  validate(createRoleSchema),
  createRole
);

roleRouter.patch(
  "/:id",
  requireAuth,
  requirePermission("rbac.roles.update"),
  validate(idParamSchema, "params"),
  validate(updateRoleSchema),
  updateRole
);

roleRouter.delete(
  "/:id",
  requireAuth,
  requirePermission("rbac.roles.delete"),
  validate(idParamSchema, "params"),
  deleteRole
);

roleRouter.get(
  "/:id/permissions",
  requireAuth,
  requirePermission("rbac.role-permissions.view"),
  validate(idParamSchema, "params"),
  listRolePermissions
);

roleRouter.post(
  "/:id/permissions",
  requireAuth,
  requirePermission("rbac.role-permissions.assign"),
  validate(idParamSchema, "params"),
  validate(assignPermissionSchema),
  assignPermission
);

roleRouter.delete(
  "/:id/permissions/:permissionId",
  requireAuth,
  requirePermission("rbac.role-permissions.remove"),
  validate(rolePermissionIdParamSchema, "params"),
  removePermission
);