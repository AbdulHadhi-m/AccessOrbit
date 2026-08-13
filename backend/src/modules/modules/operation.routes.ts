import { Router } from "express";
import { validate } from "../../shared/middleware/validate.js";
import { idParamSchema } from "../../shared/validators/common.js";
import { requireAuth } from "../auth/require-auth.js";
import { requirePermission } from "../authorization/require-permission.js";
import {
  createOperation,
  deleteOperation,
  getOperation,
  listOperations,
  updateOperation,
} from "./operation.controller.js";
import {
  createOperationSchema,
  listOperationsQuerySchema,
  updateOperationSchema,
} from "./operation.validators.js";

export const operationRouter = Router();

operationRouter.get(
  "/",
  requireAuth,
  requirePermission("rbac.operations.view"),
  validate(listOperationsQuerySchema, "query"),
  listOperations
);

operationRouter.get(
  "/:id",
  requireAuth,
  requirePermission("rbac.operations.view"),
  validate(idParamSchema, "params"),
  getOperation
);

operationRouter.post(
  "/",
  requireAuth,
  requirePermission("rbac.operations.create"),
  validate(createOperationSchema),
  createOperation
);

operationRouter.patch(
  "/:id",
  requireAuth,
  requirePermission("rbac.operations.update"),
  validate(idParamSchema, "params"),
  validate(updateOperationSchema),
  updateOperation
);

operationRouter.delete(
  "/:id",
  requireAuth,
  requirePermission("rbac.operations.delete"),
  validate(idParamSchema, "params"),
  deleteOperation
);