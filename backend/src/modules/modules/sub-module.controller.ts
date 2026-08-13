import type { NextFunction, Request, Response } from "express";
import { HttpStatus } from "../../shared/constants/http.js";
import { sendSuccess } from "../../shared/utils/response.js";
import { subModuleService } from "./sub-module.service.js";

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
    sendSuccess(res, undefined, { message: "Sub-module deleted" });
  } catch (error) {
    next(error);
  }
}