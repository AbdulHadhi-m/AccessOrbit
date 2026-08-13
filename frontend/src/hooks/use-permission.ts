"use client";

import { useCallback } from "react";
import { useSession } from "@/hooks/use-session";
import { isForbidden, toErrorMessage } from "@/lib/errors";

export interface PermissionApi {
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: readonly string[]) => boolean;
  hasAllPermissions: (permissions: readonly string[]) => boolean;
}

export function usePermission(): PermissionApi {
  const { can } = useSession();

  const hasPermission = useCallback((permission: string) => can(permission), [can]);

  const hasAnyPermission = useCallback(
    (permissions: readonly string[]) => permissions.some((permission) => can(permission)),
    [can]
  );

  const hasAllPermissions = useCallback(
    (permissions: readonly string[]) => permissions.every((permission) => can(permission)),
    [can]
  );

  return { hasPermission, hasAnyPermission, hasAllPermissions };
}

export function usePermissionError(fallback?: string) {
  const { refresh } = useSession();

  return useCallback(
    (error: unknown) => {
      if (isForbidden(error)) {
        void refresh().catch(() => undefined);
        return "You do not have permission to perform this action. If you believe this is a mistake, contact an administrator.";
      }
      return toErrorMessage(error, fallback);
    },
    [refresh, fallback]
  );
}