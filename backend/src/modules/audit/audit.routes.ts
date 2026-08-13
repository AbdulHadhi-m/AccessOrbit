import { Router } from "express";
import { validate } from "../../shared/middleware/validate.js";
import { requireAuth } from "../auth/require-auth.js";
import { requirePermission } from "../authorization/require-permission.js";
import { listAuditLogs } from "./audit.controller.js";
import { listAuditLogsQuerySchema } from "./audit.validators.js";

export const auditRouter = Router();

auditRouter.get(
  "/",
  requireAuth,
  requirePermission("audit.view"),
  validate(listAuditLogsQuerySchema, "query"),
  listAuditLogs
);
