import type { NextFunction, Request, Response } from "express";
import { HttpStatus } from "../../shared/constants/http.js";
import { sendSuccess } from "../../shared/utils/response.js";
import { moduleService } from "./module.service.js";

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
    sendSuccess(res, { module }, { statusCode: HttpStatus.CREATED, message: "Module created" });
  } catch (error) {
    next(error);
  }
}

export async function updateModule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const module = await moduleService.updateModule(req.params.id as string, req.body);
    sendSuccess(res, { module }, { message: "Module updated" });
  } catch (error) {
    next(error);
  }
}

export async function deleteModule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await moduleService.deleteModule(req.params.id as string);
    sendSuccess(res, undefined, { message: "Module deleted" });
  } catch (error) {
    next(error);
  }
}