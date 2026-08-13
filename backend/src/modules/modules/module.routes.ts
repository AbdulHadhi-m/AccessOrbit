import { Router } from "express";
import { validate } from "../../shared/middleware/validate.js";
import { idParamSchema } from "../../shared/validators/common.js";
import { requireAuth } from "../auth/require-auth.js";
import { requirePermission } from "../authorization/require-permission.js";
import {
  createModule,
  deleteModule,
  getHierarchy,
  getModule,
  listModules,
  updateModule,
} from "./module.controller.js";
import {
  createModuleSchema,
  listModulesQuerySchema,
  updateModuleSchema,
} from "./module.validators.js";

export const moduleRouter = Router();

moduleRouter.get(
  "/",
  requireAuth,
  requirePermission("rbac.modules.view"),
  validate(listModulesQuerySchema, "query"),
  listModules
);

moduleRouter.get(
  "/hierarchy",
  requireAuth,
  requirePermission("rbac.modules.view"),
  getHierarchy
);

moduleRouter.get(
  "/:id",
  requireAuth,
  requirePermission("rbac.modules.view"),
  validate(idParamSchema, "params"),
  getModule
);

moduleRouter.post(
  "/",
  requireAuth,
  requirePermission("rbac.modules.create"),
  validate(createModuleSchema),
  createModule
);

moduleRouter.patch(
  "/:id",
  requireAuth,
  requirePermission("rbac.modules.update"),
  validate(idParamSchema, "params"),
  validate(updateModuleSchema),
  updateModule
);

moduleRouter.delete(
  "/:id",
  requireAuth,
  requirePermission("rbac.modules.delete"),
  validate(idParamSchema, "params"),
  deleteModule
);