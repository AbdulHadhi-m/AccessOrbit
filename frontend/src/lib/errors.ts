import { ApiError } from "@/types/auth";
import type { ApiErrorField } from "@/types/api";

const GENERIC_MESSAGE = "Something went wrong. Please try again.";

export function toErrorMessage(error: unknown, fallback = GENERIC_MESSAGE): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        return "Your session has expired. Please sign in again.";
      case 403:
        return "You do not have permission to perform this action.";
      case 404:
        return "The requested resource was not found.";
      case 409:
        return error.message || "The resource could not be modified.";
      case 422: {
        const first = error.details?.[0];
        return first ? first.message : "Please check your input and try again.";
      }
      case 429:
        return "Too many requests. Please try again later.";
      default:
        return GENERIC_MESSAGE;
    }
  }
  return error instanceof Error ? error.message : fallback;
}

export function toFieldErrors(error: unknown): Record<string, string> | null {
  if (!(error instanceof ApiError) || !error.details || error.details.length === 0) {
    return null;
  }
  const errors: Record<string, string> = {};
  for (const detail of error.details) {
    if (detail.field && !errors[detail.field]) {
      errors[detail.field] = detail.message;
    }
  }
  return errors;
}

export function toApiError(error: unknown): ApiError | null {
  return error instanceof ApiError ? error : null;
}

export function isForbidden(error: unknown): boolean {
  return error instanceof ApiError && error.status === 403;
}

export function toRequestId(error: unknown): string | undefined {
  return toApiError(error)?.requestId;
}

export function fieldError(details: ApiErrorField[] | undefined, field: string): string | undefined {
  return details?.find((detail) => detail.field === field)?.message;
}