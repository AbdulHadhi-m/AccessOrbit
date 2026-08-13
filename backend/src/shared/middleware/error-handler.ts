import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { logger } from "../logger/logger.js";
import { HttpStatus } from "../constants/http.js";
import { sendFailure } from "../utils/response.js";
import { AppError } from "../errors/http-errors.js";

function isMongoDuplicateKeyError(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;
}

interface MongoCastError {
  name?: string;
  kind?: string;
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    sendFailure(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join(".") || "body",
      message: issue.message,
    }));
    sendFailure(
      res,
      HttpStatus.UNPROCESSABLE_ENTITY,
      "VALIDATION_ERROR",
      "Validation failed",
      details
    );
    return;
  }

  const castError = err as MongoCastError;
  if (castError.name === "CastError") {
    sendFailure(res, HttpStatus.BAD_REQUEST, "BAD_REQUEST", "Invalid identifier format");
    return;
  }

  if (isMongoDuplicateKeyError(err)) {
    sendFailure(res, HttpStatus.CONFLICT, "CONFLICT", "Resource already exists");
    return;
  }

  void req;
  logger.error({ err }, "Unhandled error");

  sendFailure(
    res,
    HttpStatus.INTERNAL_SERVER_ERROR,
    "INTERNAL_SERVER_ERROR",
    "An unexpected error occurred"
  );
};