import type { UserStatus } from "./auth";

export interface UserRoleRef {
  id: string;
  name: string;
  slug: string;
  active: boolean;
}

export interface UserDto {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  lastLoginAt: string | null;
  roles: UserRoleRef[];
  createdAt: string;
  updatedAt: string;
}

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

export interface SetUserRolesInput {
  roleIds: string[];
}