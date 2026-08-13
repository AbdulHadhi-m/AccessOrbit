"use client";

import type { ReactNode } from "react";
import { AccessDenied } from "@/components/access-denied";
import { useSession } from "@/hooks/use-session";
import { usePermission } from "@/hooks/use-permission";

export interface PermissionGuardProps {
  permission?: string;
  anyOf?: readonly string[];
  allOf?: readonly string[];
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGuard({
  permission,
  anyOf,
  allOf,
  fallback = <AccessDenied />,
  children,
}: PermissionGuardProps) {
  const { status } = useSession();
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission();

  if (status === "loading") {
    return null;
  }

  const allowed =
    permission !== undefined
      ? hasPermission(permission)
      : anyOf !== undefined
        ? hasAnyPermission(anyOf)
        : allOf !== undefined
          ? hasAllPermissions(allOf)
          : true;

  return allowed ? children : fallback;
}