import { ConflictError, NotFoundError, ValidationError } from "../../shared/errors/index.js";
import { PERMISSION_KEY_PATTERN } from "../../shared/utils/slug.js";
import { isDuplicateKeyError } from "../../shared/utils/mongo.js";
import {
  permissionRepository,
  type CreatePermissionInput,
  type UpdatePermissionInput,
} from "./permission.repository.js";
import { operationRepository } from "../modules/operation.repository.js";

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

  findByKey(key: string) {
    return permissionRepository.findByKey(key);
  },
};
