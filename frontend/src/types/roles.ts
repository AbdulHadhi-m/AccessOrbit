export interface RoleDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  isSystem: boolean;
  active: boolean;
  permissionKeys: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleInput {
  name: string;
  description?: string;
  permissionKeys?: string[];
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  active?: boolean;
}

export interface RolePermissionItem {
  roleId: string;
  permissionKey: string;
  enabled: boolean;
  permission: {
    id: string;
    key: string;
    name: string;
    description: string;
    moduleId: string;
    operationId: string;
    active: boolean;
  } | null;
}

export interface AssignPermissionInput {
  permissionKey: string;
}