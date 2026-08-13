import type { Response } from "express";
import type { ApiErrorBody, ApiErrorField, ApiSuccess } from "../types/api.js";

function requestIdOf(res: Response): string {
  return res.locals.requestId ?? "unknown";
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  options?: { message?: string; statusCode?: number }
): Response<ApiSuccess<T>> {
  return res.status(options?.statusCode ?? 200).json({
    success: true,
    message: options?.message,
    data,
    requestId: requestIdOf(res),
  });
}

export function sendFailure(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: ApiErrorField[]
): Response {
  const body: ApiErrorBody = { code, message, details };
  return res.status(statusCode).json({
    success: false,
    message,
    error: body,
    requestId: requestIdOf(res),
  });
}