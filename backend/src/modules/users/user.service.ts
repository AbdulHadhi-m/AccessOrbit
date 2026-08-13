import bcrypt from "bcrypt";
import { Types } from "mongoose";
import type { UserStatus } from "../../database/models/index.js";
import { ConflictError, NotFoundError, ValidationError } from "../../shared/errors/index.js";
import { paginationMeta, parseSort } from "../../shared/utils/pagination.js";
import { BCRYPT_COST } from "../auth/auth.service.js";
import { tokenService } from "../auth/token.service.js";
import { roleRepository } from "../roles/role.repository.js";
import { userRepository } from "./user.repository.js";

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  roleIds?: string[];
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  status?: UserStatus;
}

export interface ListUsersInput {
  page: number;
  limit: number;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
  status?: UserStatus;
}

const ALLOWED_SORTS = ["name", "email", "status", "createdAt", "lastLoginAt"];

function toUserDto(user: Record<string, unknown>) {
  const roles = Array.isArray(user.roleIds) ? user.roleIds : [];
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    status: user.status,
    lastLoginAt: user.lastLoginAt ?? null,
    roles: roles.map((role) => ({
      id: String((role as { _id: unknown })._id),
      name: (role as { name: string }).name,
      slug: (role as { slug: string }).slug,
      active: (role as { active: boolean }).active,
    })),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function validateRoleIds(roleIds: string[]): Promise<Types.ObjectId[]> {
  const uniqueIds = [...new Set(roleIds)];
  const roles = await roleRepository.findByIds(uniqueIds);
  const found = new Set(roles.map((role) => role._id.toString()));
  const missing = uniqueIds.filter((id) => !found.has(id));
  if (missing.length > 0) {
    throw new ValidationError(
      missing.map((id) => ({ field: "roleIds", message: `Role does not exist: ${id}` }))
    );
  }
  return uniqueIds.map((id) => new Types.ObjectId(id));
}

export const userService = {
  async createUser(input: CreateUserInput) {
    const email = input.email.toLowerCase();
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError(`User with email "${email}" already exists`);
    }
    const roleIds = input.roleIds ? await validateRoleIds(input.roleIds) : [];
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
    const created = await userRepository.create({
      name: input.name,
      email,
      passwordHash,
      roleIds,
      status: "active",
    });
    const doc = await userRepository.findByIdWithRoles(created._id);
    if (!doc) {
      throw new NotFoundError("User not found");
    }
    return toUserDto(doc as unknown as Record<string, unknown>);
  },

  async getUserById(id: string) {
    const user = await userRepository.findByIdWithRoles(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return toUserDto(user as unknown as Record<string, unknown>);
  },

  async listUsers(input: ListUsersInput) {
    const { items, total } = await userRepository.list({
      page: input.page,
      limit: input.limit,
      search: input.search,
      status: input.status,
      sort: parseSort({ sort: input.sort, order: input.order }, ALLOWED_SORTS),
    });
    return {
      items: items.map((user) => toUserDto(user)),
      ...paginationMeta(total, input.page, input.limit),
    };
  },

  async updateUser(id: string, actorUserId: string, input: UpdateUserInput) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    if (input.email !== undefined) {
      const email = input.email.toLowerCase();
      if (email !== user.email) {
        const existing = await userRepository.findByEmail(email);
        if (existing && existing._id.toString() !== id) {
          throw new ConflictError(`User with email "${email}" already exists`);
        }
      }
      user.email = email;
    }
    if (input.status === "suspended" && id === actorUserId) {
      throw new ConflictError("You cannot disable your own account");
    }
    const patch: { name?: string; email?: string; status?: UserStatus } = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.email !== undefined) patch.email = input.email.toLowerCase();
    if (input.status !== undefined) patch.status = input.status;
    await userRepository.updateById(id, patch);
    return this.getUserById(id);
  },

  async setUserRoles(id: string, roleIds: string[]) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    const objectIds = await validateRoleIds(roleIds);
    await userRepository.setRoles(id, objectIds);
    return this.getUserById(id);
  },

  async deleteUser(id: string, actorUserId: string) {
    if (id === actorUserId) {
      throw new ConflictError("You cannot delete your own account");
    }
    const user = await userRepository.findById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    await tokenService.revokeAllForUser(id);
    await userRepository.deleteById(id);
  },
};