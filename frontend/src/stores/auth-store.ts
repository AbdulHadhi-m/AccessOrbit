"use client";

import { create } from "zustand";
import { authService } from "@/services/auth.service";
import type { AuthStatus, User } from "@/types/auth";

interface AuthState {
  user: User | null;
  status: AuthStatus;
  accessToken: string | null;
}

interface AuthActions {
  setAccessToken: (token: string | null) => void;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<User>;
  initialize: () => Promise<void>;
  can: (permission: string) => boolean;
}

export type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  status: "loading",
  accessToken: null,

  setAccessToken: (token) => {
    const prev = get().accessToken;
    set({ accessToken: token });

    // Auto-logout when token is cleared externally
    if (token === null && prev !== null && get().status === "authenticated") {
      set({ user: null, status: "unauthenticated" });
    }
  },

  initialize: async () => {
    try {
      const { user } = await authService.me();
      set({ user, status: "authenticated" });
    } catch {
      set({ user: null, status: "unauthenticated" });
    }
  },

  login: async (email, password) => {
    const session = await authService.login({ email, password });
    set({
      accessToken: session.accessToken,
      user: session.user,
      status: "authenticated",
    });
    return session.user;
  },

  logout: async () => {
    try {
      await authService.logout();
    } finally {
      set({ accessToken: null, user: null, status: "unauthenticated" });
    }
  },

  refresh: async () => {
    const { user } = await authService.me();
    set({ user, status: "authenticated" });
    return user;
  },

  can: (permission) => {
    return get().user?.permissions.includes(permission) ?? false;
  },
}));
