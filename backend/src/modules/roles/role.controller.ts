import type { NextFunction, Request, Response } from "express";
import { HttpStatus } from "../../shared/constants/http.js";
import { sendSuccess } from "../../shared/utils/response.js";
import { roleService } from "./role.service.js";

export async function listRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await roleService.listRoles(req.query as never);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function getRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const role = await roleService.getRoleById(req.params.id as string);
    sendSuccess(res, { role });
  } catch (error) {
    next(error);
  }
}

export async function createRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const role = await roleService.createRoleWithPermissions(req.body);
    sendSuccess(res, { role }, { statusCode: HttpStatus.CREATED, message: "Role created" });
  } catch (error) {
    next(error);
  }
}

export async function updateRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const role = await roleService.updateRole(req.params.id as string, req.body);
    sendSuccess(res, { role }, { message: "Role updated" });
  } catch (error) {
    next(error);
  }
}

export async function deleteRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await roleService.deleteRole(req.params.id as string);
    sendSuccess(res, undefined, { message: "Role deleted" });
  } catch (error) {
    next(error);
  }
}

export async function listRolePermissions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await roleService.listRolePermissions(req.params.id as string);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function assignPermission(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await roleService.assignPermissionToRole(req.params.id as string, req.body.permissionKey);
    sendSuccess(res, data, { message: "Permission assigned" });
  } catch (error) {
    next(error);
  }
}

export async function removePermission(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await roleService.removePermissionFromRole(req.params.id as string, req.params.permissionId as string);
    sendSuccess(res, undefined, { message: "Permission removed" });
  } catch (error) {
    next(error);
  }
}