import type { UserDto } from "@/types/users";
import type { RoleDto } from "@/types/roles";
import type { PermissionDto, HierarchyModule } from "@/types/rbac";

export interface DashboardAccess {
  users: boolean;
  roles: boolean;
  permissions: boolean;
  modules: boolean;
}

export interface DashboardUserStats {
  total: number;
  active: number;
  suspended: number;
  recent: UserDto[];
}

export interface DashboardRoleStats {
  total: number;
  recent: RoleDto[];
}

export interface DashboardPermissionStats {
  total: number;
  recent: PermissionDto[];
}

export interface DashboardHierarchyCounts {
  modules: number;
  subModules: number;
  operations: number;
  permissions: number;
}

export interface DashboardOverview {
  users: DashboardUserStats | null;
  roles: DashboardRoleStats | null;
  permissions: DashboardPermissionStats | null;
  hierarchy: { modules: HierarchyModule[]; counts: DashboardHierarchyCounts } | null;
}