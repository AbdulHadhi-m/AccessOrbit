import { Types, type FilterQuery } from "mongoose";
import { ModuleModel, type Module } from "../../database/models/index.js";
import { toCaseInsensitiveRegex } from "../../shared/utils/pagination.js";

export interface UpsertModuleInput {
  key: string;
  name: string;
  description?: string;
  order?: number;
  icon?: string;
}

export interface ModuleListInput {
  page: number;
  limit: number;
  search?: string;
  status?: "active" | "inactive";
  sort: Record<string, 1 | -1>;
}

export interface ModuleListResult {
  items: Array<Record<string, unknown>>;
  total: number;
}

export const moduleRepository = {
  findById(id: string | Types.ObjectId) {
    return ModuleModel.findById(id).lean().exec();
  },

  findByKey(key: string) {
    return ModuleModel.findOne({ key }).lean().exec();
  },

  findAll() {
    return ModuleModel.find({}).sort({ order: 1 }).lean().exec();
  },

  async list(input: ModuleListInput): Promise<ModuleListResult> {
    const filter: FilterQuery<Module> = {};
    if (input.search) {
      const regex = toCaseInsensitiveRegex(input.search);
      filter.$or = [{ name: regex }, { key: regex }, { description: regex }];
    }
    if (input.status) {
      filter.active = input.status === "active";
    }
    const [items, total] = await Promise.all([
      ModuleModel.find(filter)
        .sort(input.sort)
        .skip((input.page - 1) * input.limit)
        .limit(input.limit)
        .lean()
        .exec(),
      ModuleModel.countDocuments(filter).exec(),
    ]);
    return { items, total };
  },

  upsertByKey(input: UpsertModuleInput) {
    return ModuleModel.findOneAndUpdate(
      { key: input.key },
      {
        $set: {
          name: input.name,
          description: input.description ?? "",
          order: input.order ?? 0,
          icon: input.icon ?? "",
          active: true,
        },
      },
      { upsert: true, new: true, runValidators: true }
    ).exec();
  },

  create(input: UpsertModuleInput) {
    return ModuleModel.create(input);
  },

  updateById(
    id: string | Types.ObjectId,
    patch: { name?: string; description?: string; order?: number; icon?: string; active?: boolean }
  ) {
    return ModuleModel.updateOne({ _id: id }, { $set: patch }).exec();
  },

  async deleteById(id: string | Types.ObjectId) {
    const result = await ModuleModel.deleteOne({ _id: id }).exec();
    return result.deletedCount === 1;
  },
};
