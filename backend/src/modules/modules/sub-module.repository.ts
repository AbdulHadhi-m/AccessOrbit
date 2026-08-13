import { Types, type FilterQuery } from "mongoose";
import { SubModuleModel, type SubModule } from "../../database/models/index.js";
import { toCaseInsensitiveRegex } from "../../shared/utils/pagination.js";

export interface UpsertSubModuleInput {
  key: string;
  name: string;
  order?: number;
}

export interface SubModuleListInput {
  page: number;
  limit: number;
  search?: string;
  status?: "active" | "inactive";
  moduleId?: string;
  sort: Record<string, 1 | -1>;
}

export interface SubModuleListResult {
  items: Array<Record<string, unknown>>;
  total: number;
}

export const subModuleRepository = {
  findById(id: string | Types.ObjectId) {
    return SubModuleModel.findById(id).lean().exec();
  },

  findByModuleAndKey(moduleId: string | Types.ObjectId, key: string) {
    return SubModuleModel.findOne({ moduleId, key }).lean().exec();
  },

  findByModuleIds(moduleIds: (string | Types.ObjectId)[]) {
    return SubModuleModel.find({ moduleId: { $in: moduleIds } }).sort({ order: 1 }).lean().exec();
  },

  upsertByModuleAndKey(moduleId: string | Types.ObjectId, input: UpsertSubModuleInput) {
    return SubModuleModel.findOneAndUpdate(
      { moduleId, key: input.key },
      {
        $set: { name: input.name, order: input.order ?? 0, active: true },
      },
      { upsert: true, new: true, runValidators: true }
    ).exec();
  },

  async list(input: SubModuleListInput): Promise<SubModuleListResult> {
    const filter: FilterQuery<SubModule> = {};
    if (input.moduleId) {
      filter.moduleId = new Types.ObjectId(input.moduleId);
    }
    if (input.search) {
      const regex = toCaseInsensitiveRegex(input.search);
      filter.$or = [{ name: regex }, { key: regex }];
    }
    if (input.status) {
      filter.active = input.status === "active";
    }
    const [items, total] = await Promise.all([
      SubModuleModel.find(filter)
        .sort(input.sort)
        .skip((input.page - 1) * input.limit)
        .limit(input.limit)
        .lean()
        .exec(),
      SubModuleModel.countDocuments(filter).exec(),
    ]);
    return { items, total };
  },

  create(input: UpsertSubModuleInput & { moduleId: Types.ObjectId }) {
    return SubModuleModel.create(input);
  },

  updateById(id: string | Types.ObjectId, patch: { name?: string; order?: number; active?: boolean }) {
    return SubModuleModel.updateOne({ _id: id }, { $set: patch }).exec();
  },

  async deleteById(id: string | Types.ObjectId) {
    const result = await SubModuleModel.deleteOne({ _id: id }).exec();
    return result.deletedCount === 1;
  },

  countByModule(moduleId: string | Types.ObjectId) {
    return SubModuleModel.countDocuments({ moduleId }).exec();
  },
};