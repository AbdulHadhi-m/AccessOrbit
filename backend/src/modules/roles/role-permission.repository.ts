import { Types } from "mongoose";
import { RolePermissionModel } from "../../database/models/index.js";

export interface RolePermissionRowInput {
  roleId: Types.ObjectId;
  permissionKey: string;
  enabled?: boolean;
}

export const rolePermissionRepository = {
  findEnabledKeysByRoleIds(roleIds: (string | Types.ObjectId)[]) {
    return RolePermissionModel.distinct("permissionKey", {
      roleId: { $in: roleIds },
      enabled: true,
    }).exec();
  },

  findByRole(roleId: string | Types.ObjectId) {
    return RolePermissionModel.find({ roleId }).lean().exec();
  },

  findByRoleIds(roleIds: (string | Types.ObjectId)[]) {
    return RolePermissionModel.find({ roleId: { $in: roleIds } }).lean().exec();
  },

  findByRoleAndKey(roleId: string | Types.ObjectId, permissionKey: string) {
    return RolePermissionModel.findOne({ roleId, permissionKey }).lean().exec();
  },

  insertMany(rows: RolePermissionRowInput[]) {
    return RolePermissionModel.insertMany(rows);
  },

  deleteByRole(roleId: string | Types.ObjectId) {
    return RolePermissionModel.deleteMany({ roleId }).exec();
  },

  deleteByRoleAndKeys(roleId: string | Types.ObjectId, permissionKeys: string[]) {
    return RolePermissionModel.deleteMany({ roleId, permissionKey: { $in: permissionKeys } }).exec();
  },

  countByPermissionKey(permissionKey: string) {
    return RolePermissionModel.countDocuments({ permissionKey }).exec();
  },
};
