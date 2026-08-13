"use client";

import { usePermission } from "@/hooks/use-permission";
import { useSession } from "@/hooks/use-session";
import { PERMISSIONS } from "@/config/permissions";
import { useQuery } from "@/lib/query/query-client";
import { dashboardService } from "../services/dashboard.service";
import type { DashboardAccess } from "../types/dashboard";

export function useDashboard() {
  const { user } = useSession();
  const { hasPermission } = usePermission();

  const access: DashboardAccess = {
    users: hasPermission(PERMISSIONS.users.view),
    roles: hasPermission(PERMISSIONS.roles.view),
    permissions: hasPermission(PERMISSIONS.permissions.view),
    modules: hasPermission(PERMISSIONS.modules.view),
  };

  const key = user ? `dashboard:overview:${user.id}` : "dashboard:overview";
  return useQuery(key, () => dashboardService.getOverview(access));
}