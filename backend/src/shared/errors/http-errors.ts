import type { ApiErrorField } from "../types/api.js";
import { HttpStatus } from "../constants/http.js";

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: ApiErrorField[];

  constructor(message: string, statusCode: number, code: string, details?: ApiErrorField[]) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request", details?: ApiErrorField[]) {
    super(message, HttpStatus.BAD_REQUEST, "BAD_REQUEST", details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required", code = "UNAUTHENTICATED") {
    super(message, HttpStatus.UNAUTHORIZED, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action", code = "FORBIDDEN") {
    super(message, HttpStatus.FORBIDDEN, code);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, HttpStatus.NOT_FOUND, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(message, HttpStatus.CONFLICT, "CONFLICT");
  }
}

export class ValidationError extends AppError {
  constructor(details: ApiErrorField[], message = "Validation failed") {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY, "VALIDATION_ERROR", details);
  }
}

export class InternalServerError extends AppError {
  constructor(message = "An unexpected error occurred") {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR");
  }
}
