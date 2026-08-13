"use client";

import type { ReactNode } from "react";
import { useSession } from "@/hooks/use-session";
import { AccessDenied } from "@/components/access-denied";

interface PermissionGateProps {
  permission: string;
  children: ReactNode;
}

export function PermissionGate({ permission, children }: PermissionGateProps) {
  const { status, can } = useSession();

  if (status === "loading") {
    return null;
  }
  if (!can(permission)) {
    return <AccessDenied />;
  }
  return children;
}

interface CanProps {
  permission: string;
  children: ReactNode;
}

export function Can({ permission, children }: CanProps) {
  const { can } = useSession();
  return can(permission) ? children : null;
}