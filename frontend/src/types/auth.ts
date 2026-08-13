import type { ApiErrorField } from "@/types/api";

export type UserStatus = "active" | "suspended";

export interface RoleRef {
  id: string;
  name: string;
  slug: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  roles: RoleRef[];
  status: UserStatus;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  expiresIn: number;
}

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: ApiErrorField[];
  readonly requestId?: string;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: ApiErrorField[],
    requestId?: string
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

export const AUTH_ERROR_CODES = [
  "AUTH_UNAUTHORIZED",
  "AUTH_TOKEN_INVALID",
  "AUTH_TOKEN_EXPIRED",
  "AUTH_REFRESH_INVALID",
  "AUTH_REFRESH_REUSE",
] as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[number];

export function isAuthTokenError(code: string): boolean {
  return (AUTH_ERROR_CODES as readonly string[]).includes(code);
}