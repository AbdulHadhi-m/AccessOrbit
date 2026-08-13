import { Types, type FilterQuery } from "mongoose";
import { PermissionModel, type Permission } from "../../database/models/index.js";
import { toCaseInsensitiveRegex } from "../../shared/utils/pagination.js";

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

export interface PermissionListInput {
  page: number;
  limit: number;
  search?: string;
  status?: "active" | "inactive";
  moduleId?: string;
  sort: Record<string, 1 | -1>;
}

export interface PermissionListResult {
  items: Array<Record<string, unknown>>;
  total: number;
}

export const permissionRepository = {
  findById(id: string | Types.ObjectId) {
    return PermissionModel.findById(id).lean().exec();
  },

  findByKey(key: string) {
    return PermissionModel.findOne({ key }).lean().exec();
  },

  findActiveByKey(key: string) {
    return PermissionModel.findOne({ key, active: true }).lean().exec();
  },

  findActiveKeysByKeys(keys: string[]) {
    return PermissionModel.distinct("key", { key: { $in: keys }, active: true }).exec();
  },

  findByKeys(keys: string[]) {
    return PermissionModel.find({ key: { $in: keys } }).lean().exec();
  },

  findByOperationIds(operationIds: (string | Types.ObjectId)[]) {
    return PermissionModel.find({ operationId: { $in: operationIds } }).lean().exec();
  },

  async list(input: PermissionListInput): Promise<PermissionListResult> {
    const filter: FilterQuery<Permission> = {};
    if (input.moduleId) {
      filter.moduleId = new Types.ObjectId(input.moduleId);
    }
    if (input.search) {
      const regex = toCaseInsensitiveRegex(input.search);
      filter.$or = [{ key: regex }, { name: regex }, { description: regex }];
    }
    if (input.status) {
      filter.active = input.status === "active";
    }
    const [items, total] = await Promise.all([
      PermissionModel.find(filter)
        .sort(input.sort)
        .skip((input.page - 1) * input.limit)
        .limit(input.limit)
        .lean()
        .exec(),
      PermissionModel.countDocuments(filter).exec(),
    ]);
    return { items, total };
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

  updateById(
    id: string | Types.ObjectId,
    patch: { name?: string; description?: string; active?: boolean }
  ) {
    return PermissionModel.updateOne({ _id: id }, { $set: patch }).exec();
  },

  setActiveById(id: string | Types.ObjectId, active: boolean) {
    return PermissionModel.updateOne({ _id: id }, { $set: { active } }).exec();
  },

  async deleteById(id: string | Types.ObjectId) {
    const result = await PermissionModel.deleteOne({ _id: id }).exec();
    return result.deletedCount === 1;
  },

  countByModule(moduleId: string | Types.ObjectId) {
    return PermissionModel.countDocuments({ moduleId }).exec();
  },

  countByOperation(operationId: string | Types.ObjectId) {
    return PermissionModel.countDocuments({ operationId }).exec();
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