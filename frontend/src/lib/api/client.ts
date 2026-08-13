import { env } from "@/config/env";
import { ApiError, isAuthTokenError } from "@/types/auth";
import type { AuthSession } from "@/types/auth";
import type { ApiFailure, ApiSuccess } from "@/types/api";
import { tokenStore } from "./token-store";

export interface ApiRequestOptions extends RequestInit {
  retry?: boolean;
}

async function parseEnvelope<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => null)) as
    | ApiSuccess<T>
    | ApiFailure
    | null;

  if (response.ok && body && body.success) {
    return body.data;
  }

  const failure = body && !body.success ? body : null;
  const status = response.status;
  const code = failure?.error.code ?? "API_ERROR";
  const message = failure?.message ?? `Request failed with status ${status}`;

  throw new ApiError(
    status,
    code,
    message,
    failure?.error.details,
    failure?.requestId
  );
}

let refreshPromise: Promise<AuthSession | null> | null = null;

export async function refreshSession(): Promise<AuthSession | null> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${env.apiUrl}/api/v1/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then((response) => {
        if (!response.ok) {
          return parseEnvelope<never>(response).catch(() => null);
        }
        return parseEnvelope<AuthSession>(response);
      })
      .then((session) => {
        if (session) {
          tokenStore.set(session.accessToken);
        } else {
          tokenStore.set(null);
        }
        return session;
      })
      .catch(() => {
        tokenStore.set(null);
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function isRetryableAuthFailure(status: number, code: string): boolean {
  return status === 401 && isAuthTokenError(code);
}

export async function apiFetch<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { retry = true, headers, ...rest } = options;

  const requestHeaders = new Headers(headers);
  if (rest.body && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const token = tokenStore.get();
  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${env.apiUrl}${path}`, {
    ...rest,
    headers: requestHeaders,
    credentials: "include",
  });

  if (response.ok) {
    return parseEnvelope<T>(response);
  }

  if (retry) {
    const failure = (await response.json().catch(() => null)) as
      | ApiFailure
      | null;
    const code = failure?.error.code ?? "API_ERROR";
    if (isRetryableAuthFailure(response.status, code)) {
      const session = await refreshSession();
      if (session) {
        return apiFetch<T>(path, { ...options, retry: false });
      }
    }
    throw new ApiError(
      response.status,
      code,
      failure?.message ?? `Request failed with status ${response.status}`,
      failure?.error.details,
      failure?.requestId
    );
  }

  return parseEnvelope<T>(response);
}