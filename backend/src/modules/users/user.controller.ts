import type { NextFunction, Request, Response } from "express";
import { HttpStatus } from "../../shared/constants/http.js";
import { sendSuccess } from "../../shared/utils/response.js";
import { userService } from "./user.service.js";
import { auditService } from "../audit/audit.service.js";

export async function listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await userService.listUsers(req.query as never);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userService.getUserById(req.params.id as string);
    sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
}

export async function createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userService.createUser(req.body);
    await auditService.logAudit({
      req,
      action: "user.create",
      category: "users",
      targetId: user.id,
      targetType: "user",
      details: req.body,
    });
    sendSuccess(res, { user }, { statusCode: HttpStatus.CREATED, message: "User created" });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userService.updateUser(req.params.id as string, req.user?.id ?? "", req.body);
    await auditService.logAudit({
      req,
      action: "user.update",
      category: "users",
      targetId: user.id,
      targetType: "user",
      details: req.body,
    });
    sendSuccess(res, { user }, { message: "User updated" });
  } catch (error) {
    next(error);
  }
}

export async function setUserRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userService.setUserRoles(req.params.id as string, req.body.roleIds);
    await auditService.logAudit({
      req,
      action: "user.assign-roles",
      category: "users",
      targetId: user.id,
      targetType: "user",
      details: { roleIds: req.body.roleIds },
    });
    sendSuccess(res, { user }, { message: "Roles updated" });
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await userService.deleteUser(req.params.id as string, req.user?.id ?? "");
    await auditService.logAudit({
      req,
      action: "user.delete",
      category: "users",
      targetId: req.params.id as string,
      targetType: "user",
    });
    sendSuccess(res, undefined, { message: "User deleted" });
  } catch (error) {
    next(error);
  }
}