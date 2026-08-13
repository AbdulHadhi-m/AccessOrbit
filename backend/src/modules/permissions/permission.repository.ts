import { Types } from "mongoose";
import { PermissionModel } from "../../database/models/index.js";

export interface CreatePermissionInput {
  key: string;
  name: string;
  description?: string;
  moduleId: Types.ObjectId;
  operationId: Types.ObjectId;
}

export interface UpdatePermissionInput {
  name?: string;
  description?: string;
}

export const permissionRepository = {
  findByKey(key: string) {
    return PermissionModel.findOne({ key }).lean().exec();
  },

  findActiveByKey(key: string) {
    return PermissionModel.findOne({ key, active: true }).lean().exec();
  },

  findActiveKeysByKeys(keys: string[]) {
    return PermissionModel.distinct("key", { key: { $in: keys }, active: true }).exec();
  },

  create(input: CreatePermissionInput) {
    return PermissionModel.create(input);
  },

  updateByKey(key: string, patch: UpdatePermissionInput) {
    return PermissionModel.updateOne({ key }, { $set: patch }).exec();
  },

  setActive(key: string, active: boolean) {
    return PermissionModel.updateOne({ key }, { $set: { active } }).exec();
  },

  upsertByKey(input: CreatePermissionInput) {
    return PermissionModel.findOneAndUpdate(
      { key: input.key },
      {
        $set: {
          name: input.name,
          description: input.description ?? "",
          moduleId: input.moduleId,
          operationId: input.operationId,
          active: true,
        },
      },
      { upsert: true, new: true, runValidators: true }
    ).exec();
  },
};
