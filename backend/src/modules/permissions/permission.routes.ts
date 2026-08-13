import { Router } from "express";
import { validate } from "../../shared/middleware/validate.js";
import { idParamSchema } from "../../shared/validators/common.js";
import { requireAuth } from "../auth/require-auth.js";
import { requirePermission } from "../authorization/require-permission.js";
import {
  createPermission,
  deletePermission,
  getPermission,
  listPermissions,
  updatePermission,
} from "./permission.controller.js";
import {
  createPermissionSchema,
  listPermissionsQuerySchema,
  updatePermissionSchema,
} from "./permission.validators.js";

export const permissionRouter = Router();

permissionRouter.get(
  "/",
  requireAuth,
  requirePermission("rbac.permissions.view"),
  validate(listPermissionsQuerySchema, "query"),
  listPermissions
);

permissionRouter.get(
  "/:id",
  requireAuth,
  requirePermission("rbac.permissions.view"),
  validate(idParamSchema, "params"),
  getPermission
);

permissionRouter.post(
  "/",
  requireAuth,
  requirePermission("rbac.permissions.create"),
  validate(createPermissionSchema),
  createPermission
);

permissionRouter.patch(
  "/:id",
  requireAuth,
  requirePermission("rbac.permissions.update"),
  validate(idParamSchema, "params"),
  validate(updatePermissionSchema),
  updatePermission
);

permissionRouter.delete(
  "/:id",
  requireAuth,
  requirePermission("rbac.permissions.delete"),
  validate(idParamSchema, "params"),
  deletePermission
);