import { Types, type FilterQuery } from "mongoose";
import { OperationModel, type Operation } from "../../database/models/index.js";
import { toCaseInsensitiveRegex } from "../../shared/utils/pagination.js";

export interface UpsertOperationInput {
  key: string;
  name: string;
  order?: number;
}

export interface OperationListInput {
  page: number;
  limit: number;
  search?: string;
  status?: "active" | "inactive";
  moduleId?: string;
  subModuleId?: string;
  sort: Record<string, 1 | -1>;
}

export interface OperationListResult {
  items: Array<Record<string, unknown>>;
  total: number;
}

export const operationRepository = {
  findById(id: string | Types.ObjectId) {
    return OperationModel.findById(id).lean().exec();
  },

  findByModuleSubModuleAndKey(
    moduleId: string | Types.ObjectId,
    subModuleId: string | Types.ObjectId | null,
    key: string
  ) {
    return OperationModel.findOne({ moduleId, subModuleId, key }).lean().exec();
  },

  findByModuleIds(moduleIds: (string | Types.ObjectId)[]) {
    return OperationModel.find({ moduleId: { $in: moduleIds } }).sort({ order: 1 }).lean().exec();
  },

  upsertByModuleSubModuleAndKey(
    moduleId: string | Types.ObjectId,
    subModuleId: string | Types.ObjectId | null,
    input: UpsertOperationInput
  ) {
    return OperationModel.findOneAndUpdate(
      { moduleId, subModuleId, key: input.key },
      {
        $set: { name: input.name, order: input.order ?? 0, active: true },
      },
      { upsert: true, new: true, runValidators: true }
    ).exec();
  },

  async list(input: OperationListInput): Promise<OperationListResult> {
    const filter: FilterQuery<Operation> = {};
    if (input.moduleId) {
      filter.moduleId = new Types.ObjectId(input.moduleId);
    }
    if (input.subModuleId) {
      filter.subModuleId = new Types.ObjectId(input.subModuleId);
    }
    if (input.search) {
      const regex = toCaseInsensitiveRegex(input.search);
      filter.$or = [{ name: regex }, { key: regex }];
    }
    if (input.status) {
      filter.active = input.status === "active";
    }
    const [items, total] = await Promise.all([
      OperationModel.find(filter)
        .sort(input.sort)
        .skip((input.page - 1) * input.limit)
        .limit(input.limit)
        .lean()
        .exec(),
      OperationModel.countDocuments(filter).exec(),
    ]);
    return { items, total };
  },

  create(input: UpsertOperationInput & { moduleId: Types.ObjectId; subModuleId: Types.ObjectId | null }) {
    return OperationModel.create(input);
  },

  updateById(id: string | Types.ObjectId, patch: { name?: string; order?: number; active?: boolean }) {
    return OperationModel.updateOne({ _id: id }, { $set: patch }).exec();
  },

  async deleteById(id: string | Types.ObjectId) {
    const result = await OperationModel.deleteOne({ _id: id }).exec();
    return result.deletedCount === 1;
  },

  countByModule(moduleId: string | Types.ObjectId) {
    return OperationModel.countDocuments({ moduleId }).exec();
  },

  countBySubModule(subModuleId: string | Types.ObjectId) {
    return OperationModel.countDocuments({ subModuleId }).exec();
  },
};