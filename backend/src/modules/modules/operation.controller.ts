import type { NextFunction, Request, Response } from "express";
import { HttpStatus } from "../../shared/constants/http.js";
import { sendSuccess } from "../../shared/utils/response.js";
import { operationService } from "./operation.service.js";

export async function listOperations(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await operationService.listOperations(req.query as never);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function getOperation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const operation = await operationService.getOperationById(req.params.id as string);
    sendSuccess(res, { operation });
  } catch (error) {
    next(error);
  }
}

export async function createOperation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const operation = await operationService.createOperation(req.body);
    sendSuccess(
      res,
      { operation },
      { statusCode: HttpStatus.CREATED, message: "Operation created" }
    );
  } catch (error) {
    next(error);
  }
}

export async function updateOperation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const operation = await operationService.updateOperation(req.params.id as string, req.body);
    sendSuccess(res, { operation }, { message: "Operation updated" });
  } catch (error) {
    next(error);
  }
}

export async function deleteOperation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await operationService.deleteOperation(req.params.id as string);
    sendSuccess(res, undefined, { message: "Operation deleted" });
  } catch (error) {
    next(error);
  }
}