import { Types } from "mongoose";
import { NotFoundError } from "../../shared/errors/index.js";
import { userRepository } from "../users/user.repository.js";
import { roleRepository } from "../roles/role.repository.js";
import { rolePermissionRepository } from "../roles/role-permission.repository.js";
import { permissionRepository } from "../permissions/permission.repository.js";

export interface PermissionResolution {
  permissions: string[];
}

export const permissionResolutionService = {
  async resolvePermissionsForUser(userId: string | Types.ObjectId): Promise<PermissionResolution> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (user.roleIds.length === 0) {
      return { permissions: [] };
    }

    const activeRoles = await roleRepository.findActiveByIds(user.roleIds);
    if (activeRoles.length === 0) {
      return { permissions: [] };
    }

    const assignedKeys = await rolePermissionRepository.findEnabledKeysByRoleIds(
      activeRoles.map((role) => role._id)
    );
    if (assignedKeys.length === 0) {
      return { permissions: [] };
    }

    const activeKeys = await permissionRepository.findActiveKeysByKeys(assignedKeys);
    return { permissions: activeKeys };
  },
};
