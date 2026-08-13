"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { authService } from "@/services/auth.service";
import { tokenStore } from "@/lib/api/token-store";
import type { AuthStatus, User } from "@/types/auth";

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  can: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    let cancelled = false;

    authService
      .me()
      .then(({ user: currentUser }) => {
        if (!cancelled) {
          setUser(currentUser);
          setStatus("authenticated");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
          setStatus("unauthenticated");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(
    () =>
      tokenStore.subscribe((token) => {
        if (token === null && status === "authenticated") {
          setUser(null);
          setStatus("unauthenticated");
        }
      }),
    [status]
  );

  const login = useCallback(async (email: string, password: string) => {
    const session = await authService.login({ email, password });
    tokenStore.set(session.accessToken);
    setUser(session.user);
    setStatus("authenticated");
    return session.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      tokenStore.set(null);
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  const can = useCallback((permission: string) => {
    return user?.permissions.includes(permission) ?? false;
  }, [user]);

  const value = useMemo(
    () => ({ user, status, login, logout, can }),
    [user, status, login, logout, can]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}