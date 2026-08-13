import { Types } from "mongoose";
import { ConflictError, NotFoundError, ValidationError } from "../../shared/errors/index.js";
import { paginationMeta, parseSort } from "../../shared/utils/pagination.js";
import { PERMISSION_KEY_PATTERN } from "../../shared/utils/slug.js";
import { isDuplicateKeyError } from "../../shared/utils/mongo.js";
import {
  permissionRepository,
  type CreatePermissionInput,
  type UpdatePermissionInput,
} from "./permission.repository.js";
import { operationRepository } from "../modules/operation.repository.js";
import { rolePermissionRepository } from "../roles/role-permission.repository.js";

export interface ListPermissionsInput {
  page: number;
  limit: number;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
  status?: "active" | "inactive";
  moduleId?: string;
}

const ALLOWED_SORTS = ["key", "name", "createdAt", "updatedAt"];

function toPermissionDto(permission: Record<string, unknown>) {
  return {
    id: String(permission._id),
    key: permission.key,
    name: permission.name,
    description: permission.description,
    moduleId: String(permission.moduleId),
    operationId: String(permission.operationId),
    active: permission.active,
    createdAt: permission.createdAt,
    updatedAt: permission.updatedAt,
  };
}

export const permissionService = {
  async createPermission(input: CreatePermissionInput) {
    if (!PERMISSION_KEY_PATTERN.test(input.key)) {
      throw new ValidationError([
        { field: "key", message: `Invalid permission key format: ${input.key}` },
      ]);
    }

    const existing = await permissionRepository.findByKey(input.key);
    if (existing) {
      throw new ConflictError(`Permission "${input.key}" already exists`);
    }

    const operation = await operationRepository.findById(input.operationId);
    if (!operation) {
      throw new NotFoundError("Operation not found");
    }
    if (operation.moduleId.toString() !== input.moduleId.toString()) {
      throw new ValidationError([
        { field: "moduleId", message: "Operation does not belong to the given module" },
      ]);
    }

    try {
      return await permissionRepository.create(input);
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        throw new ConflictError(`Permission "${input.key}" already exists`);
      }
      throw err;
    }
  },

  async ensurePermission(input: CreatePermissionInput) {
    if (!PERMISSION_KEY_PATTERN.test(input.key)) {
      throw new ValidationError([
        { field: "key", message: `Invalid permission key format: ${input.key}` },
      ]);
    }

    const operation = await operationRepository.findById(input.operationId);
    if (!operation) {
      throw new NotFoundError("Operation not found");
    }
    if (operation.moduleId.toString() !== input.moduleId.toString()) {
      throw new ValidationError([
        { field: "moduleId", message: "Operation does not belong to the given module" },
      ]);
    }

    return permissionRepository.upsertByKey(input);
  },

  async updatePermission(key: string, patch: UpdatePermissionInput) {
    const existing = await permissionRepository.findByKey(key);
    if (!existing) {
      throw new NotFoundError(`Permission "${key}" not found`);
    }
    await permissionRepository.updateByKey(key, patch);
  },

  async setPermissionActive(key: string, active: boolean) {
    const existing = await permissionRepository.findByKey(key);
    if (!existing) {
      throw new NotFoundError(`Permission "${key}" not found`);
    }
    await permissionRepository.setActive(key, active);
  },

  async getPermissionById(id: string | Types.ObjectId) {
    const permission = await permissionRepository.findById(id);
    if (!permission) {
      throw new NotFoundError("Permission not found");
    }
    return toPermissionDto(permission as unknown as Record<string, unknown>);
  },

  async listPermissions(input: ListPermissionsInput) {
    const { items, total } = await permissionRepository.list({
      page: input.page,
      limit: input.limit,
      search: input.search,
      status: input.status,
      moduleId: input.moduleId,
      sort: parseSort({ sort: input.sort, order: input.order }, ALLOWED_SORTS),
    });
    return {
      items: items.map((permission) => toPermissionDto(permission)),
      ...paginationMeta(total, input.page, input.limit),
    };
  },

  async updatePermissionById(id: string | Types.ObjectId, patch: UpdatePermissionInput & { active?: boolean }) {
    const permission = await permissionRepository.findById(id);
    if (!permission) {
      throw new NotFoundError("Permission not found");
    }
    await permissionRepository.updateById(id, patch);
    return this.getPermissionById(id);
  },

  async deletePermissionById(id: string | Types.ObjectId) {
    const permission = await permissionRepository.findById(id);
    if (!permission) {
      throw new NotFoundError("Permission not found");
    }
    const assignments = await rolePermissionRepository.countByPermissionKey(permission.key);
    if (assignments > 0) {
      throw new ConflictError(
        "Permission is assigned to roles and cannot be deleted; disable it instead"
      );
    }
    await permissionRepository.deleteById(id);
  },

  findByKey(key: string) {
    return permissionRepository.findByKey(key);
  },
};
