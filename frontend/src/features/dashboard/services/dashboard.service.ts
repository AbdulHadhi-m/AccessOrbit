import { usersService } from "@/features/users/service";
import { rolesService } from "@/features/roles/service";
import { permissionsService } from "@/features/permissions/service";
import { modulesService } from "@/features/modules/service";
import type { DashboardAccess, DashboardOverview, DashboardHierarchyCounts } from "../types/dashboard";

const RECENT_LIMIT = 5;

function countHierarchy(modules: Awaited<ReturnType<typeof modulesService.hierarchy>>): DashboardHierarchyCounts {
  let operations = 0;
  let permissions = 0;
  for (const rbacModule of modules) {
    operations += rbacModule.operations.length;
    for (const operation of rbacModule.operations) {
      permissions += operation.permissions.length;
    }
    for (const subModule of rbacModule.subModules) {
      operations += subModule.operations.length;
      for (const operation of subModule.operations) {
        permissions += operation.permissions.length;
      }
    }
  }
  return {
    modules: modules.length,
    subModules: modules.reduce((sum, module) => sum + module.subModules.length, 0),
    operations,
    permissions,
  };
}

export const dashboardService = {
  async getOverview(access: DashboardAccess): Promise<DashboardOverview> {
    const [users, roles, permissions, hierarchy] = await Promise.all([
      access.users
        ? usersService
            .list({ limit: RECENT_LIMIT, sort: "createdAt", order: "desc" })
            .then(async (list) => {
              const [active, suspended] = await Promise.all([
                usersService.list({ limit: 1, status: "active" }),
                usersService.list({ limit: 1, status: "suspended" }),
              ]);
              return {
                total: list.total,
                active: active.total,
                suspended: suspended.total,
                recent: list.items,
              };
            })
        : Promise.resolve(null),
      access.roles
        ? rolesService.list({ limit: RECENT_LIMIT, sort: "createdAt", order: "desc" })
        : Promise.resolve(null),
      access.permissions
        ? permissionsService.list({ limit: RECENT_LIMIT, sort: "createdAt", order: "desc" })
        : Promise.resolve(null),
      access.modules ? modulesService.hierarchy() : Promise.resolve(null),
    ]);

    return {
      users: users ? { total: users.total, active: users.active, suspended: users.suspended, recent: users.recent } : null,
      roles: roles ? { total: roles.total, recent: roles.items } : null,
      permissions: permissions ? { total: permissions.total, recent: permissions.items } : null,
      hierarchy: hierarchy
        ? { modules: hierarchy, counts: countHierarchy(hierarchy) }
        : null,
    };
  },
};