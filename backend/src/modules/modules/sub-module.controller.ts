import type { NextFunction, Request, Response } from "express";
import { HttpStatus } from "../../shared/constants/http.js";
import { sendSuccess } from "../../shared/utils/response.js";
import { subModuleService } from "./sub-module.service.js";
import { auditService } from "../audit/audit.service.js";

export async function listSubModules(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await subModuleService.listSubModules(req.query as never);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function getSubModule(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const subModule = await subModuleService.getSubModuleById(req.params.id as string);
    sendSuccess(res, { subModule });
  } catch (error) {
    next(error);
  }
}

export async function createSubModule(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const subModule = await subModuleService.createSubModule(req.body);
    await auditService.logAudit({
      req,
      action: "sub-module.create",
      category: "sub-modules",
      targetId: subModule.id,
      targetType: "sub-module",
      details: req.body,
    });
    sendSuccess(
      res,
      { subModule },
      { statusCode: HttpStatus.CREATED, message: "Sub-module created" }
    );
  } catch (error) {
    next(error);
  }
}

export async function updateSubModule(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const subModule = await subModuleService.updateSubModule(req.params.id as string, req.body);
    await auditService.logAudit({
      req,
      action: "sub-module.update",
      category: "sub-modules",
      targetId: subModule.id,
      targetType: "sub-module",
      details: req.body,
    });
    sendSuccess(res, { subModule }, { message: "Sub-module updated" });
  } catch (error) {
    next(error);
  }
}

export async function deleteSubModule(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await subModuleService.deleteSubModule(req.params.id as string);
    await auditService.logAudit({
      req,
      action: "sub-module.delete",
      category: "sub-modules",
      targetId: req.params.id as string,
      targetType: "sub-module",
    });
    sendSuccess(res, undefined, { message: "Sub-module deleted" });
  } catch (error) {
    next(error);
  }
}