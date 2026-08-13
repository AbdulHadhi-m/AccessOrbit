import { apiFetch, refreshSession } from "@/lib/api/client";
import type { AuthSession, User } from "@/types/auth";

export interface LoginCredentials {
  email: string;
  password: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    return apiFetch<AuthSession>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
      retry: false,
    });
  },

  async me(): Promise<{ user: User }> {
    return apiFetch<{ user: User }>("/api/v1/auth/me", {
      method: "GET",
    });
  },

  async logout(): Promise<void> {
    await apiFetch<undefined>("/api/v1/auth/logout", {
      method: "POST",
    });
  },

  refresh: refreshSession,
};