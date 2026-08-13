import { Types } from "mongoose";
import { ConflictError, NotFoundError, ValidationError } from "../../shared/errors/index.js";
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

export interface EnsureRoleInput extends CreateRoleInput {
  slug: string;
}

export type AssignMode = "replace" | "ensure";

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

  async ensureRole(input: EnsureRoleInput) {
    return roleRepository.upsertBySlug(input);
  },

  async getPermissionRows(roleId: string | Types.ObjectId) {
    const role = await roleRepository.findById(roleId);
    if (!role) {
      throw new NotFoundError("Role not found");
    }
    return rolePermissionRepository.findByRole(roleId);
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
