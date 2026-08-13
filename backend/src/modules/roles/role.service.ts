import { Types } from "mongoose";
import { ConflictError, NotFoundError, ValidationError } from "../../shared/errors/index.js";
import { paginationMeta, parseSort } from "../../shared/utils/pagination.js";
import { KEBAB_KEY_PATTERN, PERMISSION_KEY_PATTERN, kebabCase } from "../../shared/utils/slug.js";
import { roleRepository } from "./role.repository.js";
import { rolePermissionRepository } from "./role-permission.repository.js";
import { permissionRepository } from "../permissions/permission.repository.js";
import { userRepository } from "../users/user.repository.js";

export interface CreateRoleInput {
  name: string;
  description?: string;
  isSystem?: boolean;
}

export interface CreateRoleWithPermissionsInput extends CreateRoleInput {
  permissionKeys?: string[];
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  active?: boolean;
}

export interface ListRolesInput {
  page: number;
  limit: number;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
  status?: "active" | "inactive";
}

export interface EnsureRoleInput extends CreateRoleInput {
  slug: string;
}

export type AssignMode = "replace" | "ensure";

const ALLOWED_SORTS = ["name", "slug", "createdAt", "updatedAt"];

function toRoleDto(role: Record<string, unknown>, permissionKeys: string[]) {
  return {
    id: String(role._id),
    name: role.name,
    slug: role.slug,
    description: role.description,
    isSystem: role.isSystem,
    active: role.active,
    permissionKeys,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
}

export const roleService = {
  async createRole(input: CreateRoleInput) {
    const slug = kebabCase(input.name);
    if (!KEBAB_KEY_PATTERN.test(slug)) {
      throw new ValidationError([
        { field: "name", message: "Role name cannot produce a valid slug" },
      ]);
    }
    const existing = await roleRepository.findBySlug(slug);
    if (existing) {
      throw new ConflictError(`Role "${slug}" already exists`);
    }
    return roleRepository.create({ name: input.name, slug, description: input.description, isSystem: input.isSystem });
  },

  async createRoleWithPermissions(input: CreateRoleWithPermissionsInput) {
    const role = await this.createRole(input);
    if (input.permissionKeys && input.permissionKeys.length > 0) {
      await this.assignPermissions(role._id, input.permissionKeys, "ensure");
    }
    return this.getRoleById(role._id.toString());
  },

  async ensureRole(input: EnsureRoleInput) {
    return roleRepository.upsertBySlug(input);
  },

  async listRoles(input: ListRolesInput) {
    const { items, total } = await roleRepository.list({
      page: input.page,
      limit: input.limit,
      search: input.search,
      status: input.status,
      sort: parseSort({ sort: input.sort, order: input.order }, ALLOWED_SORTS),
    });
    const roleIds = items.map((role) => String(role._id));
    const rows = await rolePermissionRepository.findByRoleIds(roleIds);
    const keysByRole = new Map<string, string[]>();
    for (const row of rows) {
      const key = row.roleId.toString();
      const list = keysByRole.get(key) ?? [];
      list.push(row.permissionKey);
      keysByRole.set(key, list);
    }
    return {
      items: items.map((role) =>
        toRoleDto(role, keysByRole.get(String(role._id)) ?? [])
      ),
      ...paginationMeta(total, input.page, input.limit),
    };
  },

  async getRoleById(roleId: string | Types.ObjectId) {
    const role = await roleRepository.findById(roleId);
    if (!role) {
      throw new NotFoundError("Role not found");
    }
    const rows = await rolePermissionRepository.findByRole(roleId);
    return toRoleDto(role as unknown as Record<string, unknown>, rows.map((row) => row.permissionKey));
  },

  async updateRole(roleId: string | Types.ObjectId, input: UpdateRoleInput) {
    const role = await roleRepository.findById(roleId);
    if (!role) {
      throw new NotFoundError("Role not found");
    }
    const patch: { name?: string; slug?: string; description?: string; active?: boolean } = {};
    if (input.name !== undefined) {
      const slug = kebabCase(input.name);
      if (!KEBAB_KEY_PATTERN.test(slug)) {
        throw new ValidationError([
          { field: "name", message: "Role name cannot produce a valid slug" },
        ]);
      }
      if (slug !== role.slug) {
        const existing = await roleRepository.findBySlug(slug);
        if (existing && existing._id.toString() !== roleId.toString()) {
          throw new ConflictError(`Role "${slug}" already exists`);
        }
      }
      patch.name = input.name;
      patch.slug = slug;
    }
    if (input.description !== undefined) patch.description = input.description;
    if (input.active !== undefined) patch.active = input.active;
    await roleRepository.updateById(roleId, patch);
    return this.getRoleById(roleId);
  },

  async getPermissionRows(roleId: string | Types.ObjectId) {
    const role = await roleRepository.findById(roleId);
    if (!role) {
      throw new NotFoundError("Role not found");
    }
    return rolePermissionRepository.findByRole(roleId);
  },

  async listRolePermissions(roleId: string | Types.ObjectId) {
    const rows = await this.getPermissionRows(roleId);
    if (rows.length === 0) {
      return { items: [] };
    }
    const keys = rows.map((row) => row.permissionKey);
    const permissionDocs = await permissionRepository.findByKeys(keys);
    const byKey = new Map(permissionDocs.map((permission) => [permission.key, permission]));
    return {
      items: rows.map((row) => {
        const permission = byKey.get(row.permissionKey);
        return {
          roleId: row.roleId.toString(),
          permissionKey: row.permissionKey,
          enabled: row.enabled,
          permission: permission
            ? {
                id: permission._id.toString(),
                key: permission.key,
                name: permission.name,
                description: permission.description,
                moduleId: permission.moduleId.toString(),
                operationId: permission.operationId.toString(),
                active: permission.active,
              }
            : null,
        };
      }),
    };
  },

  async assignPermissionToRole(roleId: string | Types.ObjectId, permissionKey: string) {
    const role = await roleRepository.findById(roleId);
    if (!role) {
      throw new NotFoundError("Role not found");
    }
    if (!role.active) {
      throw new ConflictError("Cannot assign permissions to a disabled role");
    }
    if (!PERMISSION_KEY_PATTERN.test(permissionKey)) {
      throw new ValidationError([
        { field: "permissionKey", message: `Invalid permission key: ${permissionKey}` },
      ]);
    }
    const permission = await permissionRepository.findByKey(permissionKey);
    if (!permission) {
      throw new ValidationError([
        { field: "permissionKey", message: `Permission does not exist: ${permissionKey}` },
      ]);
    }
    if (!permission.active) {
      throw new ValidationError([
        { field: "permissionKey", message: `Permission is disabled: ${permissionKey}` },
      ]);
    }
    const existing = await rolePermissionRepository.findByRoleAndKey(roleId, permissionKey);
    if (existing) {
      throw new ConflictError(`Permission "${permissionKey}" is already assigned to this role`);
    }
    await rolePermissionRepository.insertMany([
      { roleId: new Types.ObjectId(role._id), permissionKey, enabled: true },
    ]);
    return this.listRolePermissions(roleId);
  },

  async removePermissionFromRole(
    roleId: string | Types.ObjectId,
    permissionId: string | Types.ObjectId
  ) {
    const role = await roleRepository.findById(roleId);
    if (!role) {
      throw new NotFoundError("Role not found");
    }
    const permission = await permissionRepository.findById(permissionId);
    if (!permission) {
      throw new NotFoundError("Permission not found");
    }
    const result = await rolePermissionRepository.deleteByRoleAndKeys(roleId, [permission.key]);
    if (result.deletedCount === 0) {
      throw new NotFoundError("Permission is not assigned to this role");
    }
  },

  async assignPermissions(
    roleId: string | Types.ObjectId,
    permissionKeys: string[],
    mode: AssignMode = "replace"
  ) {
    const role = await roleRepository.findById(roleId);
    if (!role) {
      throw new NotFoundError("Role not found");
    }

    const uniqueKeys = [...new Set(permissionKeys)];
    const invalidKeys = uniqueKeys.filter((key) => !PERMISSION_KEY_PATTERN.test(key));
    if (invalidKeys.length > 0) {
      throw new ValidationError(
        invalidKeys.map((key) => ({ field: "permissionKeys", message: `Invalid permission key: ${key}` }))
      );
    }

    const availableKeys = await permissionRepository.findActiveKeysByKeys(uniqueKeys);
    const missingKeys = uniqueKeys.filter((key) => !availableKeys.includes(key));
    if (missingKeys.length > 0) {
      throw new ValidationError(
        missingKeys.map((key) => ({ field: "permissionKeys", message: `Unknown or disabled permission: ${key}` }))
      );
    }

    const roleObjectId = new Types.ObjectId(role._id);

    if (mode === "replace") {
      await rolePermissionRepository.deleteByRole(roleId);
      if (uniqueKeys.length > 0) {
        await rolePermissionRepository.insertMany(
          uniqueKeys.map((permissionKey) => ({ roleId: roleObjectId, permissionKey, enabled: true }))
        );
      }
      return;
    }

    const existingRows = await rolePermissionRepository.findByRole(roleId);
    const existingKeys = new Set(existingRows.map((row) => row.permissionKey));
    const missingRows = uniqueKeys.filter((key) => !existingKeys.has(key));
    if (missingRows.length > 0) {
      await rolePermissionRepository.insertMany(
        missingRows.map((permissionKey) => ({ roleId: roleObjectId, permissionKey, enabled: true }))
      );
    }
  },

  async deleteRole(roleId: string | Types.ObjectId) {
    const role = await roleRepository.findById(roleId);
    if (!role) {
      throw new NotFoundError("Role not found");
    }
    if (role.isSystem) {
      throw new ConflictError("System roles cannot be deleted");
    }
    const assignedUsers = await userRepository.countByRole(roleId);
    if (assignedUsers > 0) {
      throw new ConflictError("Role is assigned to users and cannot be deleted");
    }
    await rolePermissionRepository.deleteByRole(roleId);
    await roleRepository.delete(roleId);
  },
};
