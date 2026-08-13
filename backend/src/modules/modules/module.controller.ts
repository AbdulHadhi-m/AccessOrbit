import type { NextFunction, Request, Response } from "express";
import { HttpStatus } from "../../shared/constants/http.js";
import { sendSuccess } from "../../shared/utils/response.js";
import { moduleService } from "./module.service.js";
import { auditService } from "../audit/audit.service.js";

export async function listModules(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await moduleService.listModules(req.query as never);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function getModule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const module = await moduleService.getModuleById(req.params.id as string);
    sendSuccess(res, { module });
  } catch (error) {
    next(error);
  }
}

export async function getHierarchy(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await moduleService.getHierarchy();
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function createModule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const module = await moduleService.createModule(req.body);
    await auditService.logAudit({
      req,
      action: "module.create",
      category: "modules",
      targetId: module.id,
      targetType: "module",
      details: req.body,
    });
    sendSuccess(res, { module }, { statusCode: HttpStatus.CREATED, message: "Module created" });
  } catch (error) {
    next(error);
  }
}

export async function updateModule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const module = await moduleService.updateModule(req.params.id as string, req.body);
    await auditService.logAudit({
      req,
      action: "module.update",
      category: "modules",
      targetId: module.id,
      targetType: "module",
      details: req.body,
    });
    sendSuccess(res, { module }, { message: "Module updated" });
  } catch (error) {
    next(error);
  }
}

export async function deleteModule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await moduleService.deleteModule(req.params.id as string);
    await auditService.logAudit({
      req,
      action: "module.delete",
      category: "modules",
      targetId: req.params.id as string,
      targetType: "module",
    });
    sendSuccess(res, undefined, { message: "Module deleted" });
  } catch (error) {
    next(error);
  }
}