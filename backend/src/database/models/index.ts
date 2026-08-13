import { UserModel } from "./user.model.js";
import { RoleModel } from "./role.model.js";
import { ModuleModel } from "./module.model.js";
import { SubModuleModel } from "./sub-module.model.js";
import { OperationModel } from "./operation.model.js";
import { PermissionModel } from "./permission.model.js";
import { RolePermissionModel } from "./role-permission.model.js";
import { RefreshTokenModel } from "./refresh-token.model.js";

export {
  UserModel,
  RoleModel,
  ModuleModel,
  SubModuleModel,
  OperationModel,
  PermissionModel,
  RolePermissionModel,
  RefreshTokenModel,
};

export { USER_STATUSES } from "./user.model.js";
export type { User, UserDocument, UserStatus } from "./user.model.js";
export type { Role, RoleDocument } from "./role.model.js";
export type { Module, ModuleDocument } from "./module.model.js";
export type { SubModule, SubModuleDocument } from "./sub-module.model.js";
export type { Operation, OperationDocument } from "./operation.model.js";
export type { Permission, PermissionDocument } from "./permission.model.js";
export type { RolePermission, RolePermissionDocument } from "./role-permission.model.js";
export type { RefreshToken, RefreshTokenDocument } from "./refresh-token.model.js";

export const ALL_MODELS = [
  UserModel,
  RoleModel,
  ModuleModel,
  SubModuleModel,
  OperationModel,
  PermissionModel,
  RolePermissionModel,
  RefreshTokenModel,
];
