import type { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../shared/utils/response.js";
import { auditService } from "./audit.service.js";

export async function listAuditLogs(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await auditService.listAuditLogs(req.query as never);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}
