import { Router } from "express";
import { sendSuccess } from "../../shared/utils/response.js";
import { requireAuth } from "../auth/require-auth.js";
import { requirePermission } from "../authorization/require-permission.js";

export const testRouter = Router();

testRouter.get("/employee-view", requireAuth, requirePermission("employee.employees.view"), (req, res) => {
  sendSuccess(res, { message: "Allowed: employee.employees.view", user: req.user?.id }, { statusCode: 200 });
});

testRouter.post("/employee-create", requireAuth, requirePermission("employee.employees.create"), (req, res) => {
  sendSuccess(res, { message: "Allowed: employee.employees.create", user: req.user?.id }, { statusCode: 200 });
});

testRouter.delete("/employee-delete", requireAuth, requirePermission("employee.employees.delete"), (req, res) => {
  sendSuccess(res, { message: "Allowed: employee.employees.delete", user: req.user?.id }, { statusCode: 200 });
});