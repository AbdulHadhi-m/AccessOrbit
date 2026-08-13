export type RbacStatus = "active" | "inactive";

export interface ModuleDto {
  id: string;
  key: string;
  name: string;
  description: string;
  order: number;
  icon: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateModuleInput {
  key: string;
  name: string;
  description?: string;
  order?: number;
  icon?: string;
}

export interface UpdateModuleInput {
  name?: string;
  description?: string;
  order?: number;
  icon?: string;
  active?: boolean;
}

export interface SubModuleDto {
  id: string;
  key: string;
  name: string;
  moduleId: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubModuleInput {
  moduleId: string;
  key: string;
  name: string;
  order?: number;
}

export interface UpdateSubModuleInput {
  name?: string;
  order?: number;
  active?: boolean;
}

export interface OperationDto {
  id: string;
  key: string;
  name: string;
  moduleId: string;
  subModuleId: string | null;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOperationInput {
  moduleId: string;
  subModuleId?: string | null;
  key: string;
  name: string;
  order?: number;
}

export interface UpdateOperationInput {
  name?: string;
  order?: number;
  active?: boolean;
}

export interface PermissionDto {
  id: string;
  key: string;
  name: string;
  description: string;
  moduleId: string;
  operationId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePermissionInput {
  key: string;
  name: string;
  description?: string;
  moduleId: string;
  operationId: string;
}

export interface UpdatePermissionInput {
  name?: string;
  description?: string;
  active?: boolean;
}

export interface HierarchyPermission {
  id: string;
  key: string;
  name: string;
  description: string;
  active: boolean;
}

export interface HierarchyOperation {
  id: string;
  key: string;
  name: string;
  order: number;
  active: boolean;
  permissions: HierarchyPermission[];
}

export interface HierarchySubModule {
  id: string;
  key: string;
  name: string;
  order: number;
  active: boolean;
  operations: HierarchyOperation[];
}

export interface HierarchyModule {
  id: string;
  key: string;
  name: string;
  description: string;
  order: number;
  icon: string;
  active: boolean;
  operations: HierarchyOperation[];
  subModules: HierarchySubModule[];
}