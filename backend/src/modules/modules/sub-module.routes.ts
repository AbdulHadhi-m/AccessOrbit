import { Router } from "express";
import { validate } from "../../shared/middleware/validate.js";
import { idParamSchema } from "../../shared/validators/common.js";
import { requireAuth } from "../auth/require-auth.js";
import { requirePermission } from "../authorization/require-permission.js";
import {
  createSubModule,
  deleteSubModule,
  getSubModule,
  listSubModules,
  updateSubModule,
} from "./sub-module.controller.js";
import {
  createSubModuleSchema,
  listSubModulesQuerySchema,
  updateSubModuleSchema,
} from "./sub-module.validators.js";

export const subModuleRouter = Router();

subModuleRouter.get(
  "/",
  requireAuth,
  requirePermission("rbac.sub-modules.view"),
  validate(listSubModulesQuerySchema, "query"),
  listSubModules
);

subModuleRouter.get(
  "/:id",
  requireAuth,
  requirePermission("rbac.sub-modules.view"),
  validate(idParamSchema, "params"),
  getSubModule
);

subModuleRouter.post(
  "/",
  requireAuth,
  requirePermission("rbac.sub-modules.create"),
  validate(createSubModuleSchema),
  createSubModule
);

subModuleRouter.patch(
  "/:id",
  requireAuth,
  requirePermission("rbac.sub-modules.update"),
  validate(idParamSchema, "params"),
  validate(updateSubModuleSchema),
  updateSubModule
);

subModuleRouter.delete(
  "/:id",
  requireAuth,
  requirePermission("rbac.sub-modules.delete"),
  validate(idParamSchema, "params"),
  deleteSubModule
);