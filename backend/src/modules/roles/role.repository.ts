import { Types, type FilterQuery } from "mongoose";
import { RoleModel, type Role } from "../../database/models/index.js";
import { toCaseInsensitiveRegex } from "../../shared/utils/pagination.js";

export interface CreateRoleInput {
  name: string;
  slug: string;
  description?: string;
  isSystem?: boolean;
}

export interface RoleListInput {
  page: number;
  limit: number;
  search?: string;
  status?: "active" | "inactive";
  sort: Record<string, 1 | -1>;
}

export interface RoleListResult {
  items: Array<Record<string, unknown>>;
  total: number;
}

export const roleRepository = {
  findById(id: string | Types.ObjectId) {
    return RoleModel.findById(id).lean().exec();
  },

  findBySlug(slug: string) {
    return RoleModel.findOne({ slug }).lean().exec();
  },

  findActiveByIds(ids: (string | Types.ObjectId)[]) {
    return RoleModel.find({ _id: { $in: ids }, active: true }).lean().exec();
  },

  findByIds(ids: (string | Types.ObjectId)[]) {
    return RoleModel.find({ _id: { $in: ids } }).lean().exec();
  },

  async list(input: RoleListInput): Promise<RoleListResult> {
    const filter: FilterQuery<Role> = {};
    if (input.search) {
      const regex = toCaseInsensitiveRegex(input.search);
      filter.$or = [{ name: regex }, { slug: regex }, { description: regex }];
    }
    if (input.status) {
      filter.active = input.status === "active";
    }
    const [items, total] = await Promise.all([
      RoleModel.find(filter)
        .sort(input.sort)
        .skip((input.page - 1) * input.limit)
        .limit(input.limit)
        .lean()
        .exec(),
      RoleModel.countDocuments(filter).exec(),
    ]);
    return { items, total };
  },

  create(input: CreateRoleInput) {
    return RoleModel.create(input);
  },

  upsertBySlug(input: CreateRoleInput) {
    return RoleModel.findOneAndUpdate(
      { slug: input.slug },
      {
        $set: { name: input.name, description: input.description ?? "", active: true },
        $setOnInsert: { isSystem: input.isSystem ?? false },
      },
      { upsert: true, new: true, runValidators: true }
    ).exec();
  },

  async delete(id: string | Types.ObjectId) {
    const result = await RoleModel.deleteOne({ _id: id }).exec();
    return result.deletedCount === 1;
  },

  setActive(id: string | Types.ObjectId, active: boolean) {
    return RoleModel.updateOne({ _id: id }, { $set: { active } }).exec();
  },

  updateById(
    id: string | Types.ObjectId,
    patch: { name?: string; slug?: string; description?: string; active?: boolean }
  ) {
    return RoleModel.updateOne({ _id: id }, { $set: patch }).exec();
  },
};
