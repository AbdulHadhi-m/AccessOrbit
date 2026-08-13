import bcrypt from "bcrypt";
import { Types } from "mongoose";
import type { UserStatus } from "../../database/models/index.js";
import { ForbiddenError, UnauthorizedError } from "../../shared/errors/index.js";
import { permissionResolutionService } from "../authorization/permission-resolution.service.js";
import { userRepository } from "../users/user.repository.js";
import { roleRepository } from "../roles/role.repository.js";
import { tokenService } from "./token.service.js";

export const BCRYPT_COST = 12;

const DUMMY_PASSWORD_HASH = bcrypt.hashSync("timing-equalization-dummy-password", BCRYPT_COST);

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  roles: { id: string; name: string; slug: string }[];
  status: UserStatus;
  permissions: string[];
}

async function toSafeUser(userId: string | Types.ObjectId): Promise<SafeUser> {
  const user = await userRepository.findById(userId);
  if (!user) throw new UnauthorizedError("User no longer exists", "AUTH_UNAUTHORIZED");
  const roles = await roleRepository.findActiveByIds(user.roleIds ?? []);
  const { permissions } = await permissionResolutionService.resolvePermissionsForUser(userId);
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    roles: roles.map((role) => ({ id: role._id.toString(), name: role.name, slug: role.slug })),
    status: user.status,
    permissions,
  };
}

export interface LoginResult {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
}

async function login(email: string, password: string): Promise<LoginResult> {
  const user = await userRepository.findByEmailWithPassword(email);

  if (!user) {
    await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
    throw new UnauthorizedError("Invalid email or password", "AUTH_INVALID_CREDENTIALS");
  }

  if (user.status !== "active") {
    throw new ForbiddenError("This account has been disabled", "AUTH_USER_DISABLED");
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new UnauthorizedError("Invalid email or password", "AUTH_INVALID_CREDENTIALS");
  }

  await userRepository.updateLastLogin(user._id);

  const { refreshToken } = await tokenService.createRefreshSession(user._id);

  return {
    user: await toSafeUser(user._id),
    accessToken: tokenService.signAccessToken(user._id.toString()),
    refreshToken,
  };
}

async function refresh(refreshToken: string): Promise<LoginResult> {
  const rotated = await tokenService.rotateRefreshToken(refreshToken);

  const user = await userRepository.findById(rotated.userId);
  if (!user) throw new UnauthorizedError("User no longer exists", "AUTH_UNAUTHORIZED");
  if (user.status !== "active") {
    await tokenService.revokeRefreshToken(rotated.refreshToken);
    throw new ForbiddenError("This account has been disabled", "AUTH_USER_DISABLED");
  }

  return {
    user: await toSafeUser(user._id),
    accessToken: rotated.accessToken,
    refreshToken: rotated.refreshToken,
  };
}

async function logout(refreshToken: string): Promise<void> {
  await tokenService.revokeRefreshToken(refreshToken);
}

export const authService = { login, refresh, logout, toSafeUser, BCRYPT_COST };