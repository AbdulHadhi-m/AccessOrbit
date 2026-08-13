import { Types } from "mongoose";
import { RoleModel } from "../../database/models/index.js";

export interface CreateRoleInput {
  name: string;
  slug: string;
  description?: string;
  isSystem?: boolean;
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
};
