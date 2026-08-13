import type { NextFunction, Request, Response } from "express";
import { HttpStatus } from "../../shared/constants/http.js";
import { sendSuccess } from "../../shared/utils/response.js";
import { permissionService } from "./permission.service.js";

export async function listPermissions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await permissionService.listPermissions(req.query as never);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function getPermission(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const permission = await permissionService.getPermissionById(req.params.id as string);
    sendSuccess(res, { permission });
  } catch (error) {
    next(error);
  }
}

export async function createPermission(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const permission = await permissionService.createPermission(req.body);
    sendSuccess(
      res,
      { permission: permission.toObject() },
      { statusCode: HttpStatus.CREATED, message: "Permission created" }
    );
  } catch (error) {
    next(error);
  }
}

export async function updatePermission(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const permission = await permissionService.updatePermissionById(req.params.id as string, req.body);
    sendSuccess(res, { permission }, { message: "Permission updated" });
  } catch (error) {
    next(error);
  }
}

export async function deletePermission(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await permissionService.deletePermissionById(req.params.id as string);
    sendSuccess(res, undefined, { message: "Permission deleted" });
  } catch (error) {
    next(error);
  }
}