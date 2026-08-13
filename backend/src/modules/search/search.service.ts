import { userRepository } from "../users/user.repository.js";
import { roleRepository } from "../roles/role.repository.js";
import { moduleRepository } from "../modules/module.repository.js";
import { permissionRepository } from "../permissions/permission.repository.js";
import { AuditLogModel } from "../../database/models/index.js";
import { escapeRegExp } from "../../shared/utils/pagination.js";

const MAX_RESULTS_PER_TYPE = 5;

export interface SearchParams {
  query: string;
  userId: string;
  permissions: string[];
}

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
  type: "user" | "role" | "module" | "permission" | "audit-log";
  url: string;
  badge?: string;
}

export interface SearchResult {
  results: SearchResultItem[];
  query: string;
}

function sanitizeQuery(q: string): string {
  const trimmed = q.trim();
  if (trimmed.length < 2) return "";
  return escapeRegExp(trimmed);
}

export const searchService = {
  async search(params: SearchParams): Promise<SearchResult> {
    const safeQuery = sanitizeQuery(params.query);
    if (!safeQuery) {
      return { results: [], query: params.query };
    }

    const permissions = params.permissions;
    const results: SearchResultItem[] = [];

    // Search users (requires rbac.users.view)
    if (permissions.includes("rbac.users.view")) {
      const users = await userRepository.list({
        page: 1,
        limit: MAX_RESULTS_PER_TYPE,
        search: safeQuery,
        sort: { createdAt: -1 },
      });

      for (const user of users.items) {
        const userRecord = user as Record<string, unknown>;
        const roleIds = userRecord.roleIds as string[] | undefined;
        let roleNames = "";
        if (roleIds && roleIds.length > 0) {
          const roles = await roleRepository.findActiveByIds(roleIds);
          roleNames = roles.map((r) => r.name).join(", ");
        }
        results.push({
          id: String(userRecord._id),
          title: userRecord.name as string,
          subtitle: roleNames ? `— ${roleNames}` : undefined,
          type: "user",
          url: `/users/${String(userRecord._id)}`,
          badge: userRecord.status as string,
        });
      }
    }

    // Search roles (requires rbac.roles.view)
    if (permissions.includes("rbac.roles.view")) {
      const roles = await roleRepository.list({
        page: 1,
        limit: MAX_RESULTS_PER_TYPE,
        search: safeQuery,
        status: undefined,
        sort: { createdAt: -1 },
      });

      for (const role of roles.items) {
        const roleRecord = role as Record<string, unknown>;
        results.push({
          id: String(roleRecord._id),
          title: roleRecord.name as string,
          subtitle: roleRecord.description as string,
          type: "role",
          url: `/roles/${String(roleRecord._id)}`,
          badge: roleRecord.isSystem as boolean ? "System" : undefined,
        });
      }
    }

    // Search modules (requires rbac.modules.view)
    if (permissions.includes("rbac.modules.view")) {
      const searchRegex = new RegExp(safeQuery, "i");
      const modules = await moduleRepository.search({
        query: searchRegex,
        limit: MAX_RESULTS_PER_TYPE,
      });

      for (const module of modules) {
        results.push({
          id: module._id.toString(),
          title: module.name,
          subtitle: module.description,
          type: "module",
          url: `/modules/${module._id.toString()}`,
        });
      }
    }

    // Search permissions (requires rbac.permissions.view)
    if (permissions.includes("rbac.permissions.view")) {
      const searchRegex = new RegExp(safeQuery, "i");
      const permissions_data = await permissionRepository.search({
        query: searchRegex,
        limit: MAX_RESULTS_PER_TYPE,
      });

      for (const permission of permissions_data) {
        results.push({
          id: permission._id.toString(),
          title: permission.key,
          subtitle: permission.name,
          type: "permission",
          url: `/permissions/${permission._id.toString()}`,
        });
      }
    }

    // Search audit logs (requires audit.view)
    if (permissions.includes("audit.view")) {
      const auditSearchRegex = new RegExp(safeQuery, "i");
      const auditLogs = await AuditLogModel.find({
        $or: [
          { "actor.email": auditSearchRegex },
          { "actor.name": auditSearchRegex },
          { action: auditSearchRegex },
          { category: auditSearchRegex },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(MAX_RESULTS_PER_TYPE)
        .lean();

      for (const log of auditLogs) {
        results.push({
          id: log._id.toString(),
          title: log.action,
          subtitle: `${log.actor?.name || log.actor?.email || "Unknown actor"} • ${log.category || ""}`,
          type: "audit-log",
          url: `/audit-logs`,
          badge: log.status,
        });
      }
    }

    return {
      results,
      query: params.query,
    };
  },
};
