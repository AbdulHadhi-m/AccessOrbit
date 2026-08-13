"use client";

import { useAuthStore } from "@/stores/auth-store";
import type { AuthStore } from "@/stores/auth-store";

export type SessionApi = Pick<AuthStore, "user" | "status" | "login" | "logout" | "refresh" | "can">;

export function useSession(): SessionApi {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const refresh = useAuthStore((s) => s.refresh);
  const can = useAuthStore((s) => s.can);

  return { user, status, login, logout, refresh, can };
}