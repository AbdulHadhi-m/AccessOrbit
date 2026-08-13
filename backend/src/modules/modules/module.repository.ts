import { Types } from "mongoose";
import { ModuleModel } from "../../database/models/index.js";

export interface UpsertModuleInput {
  key: string;
  name: string;
  description?: string;
  order?: number;
  icon?: string;
}

export const moduleRepository = {
  findById(id: string | Types.ObjectId) {
    return ModuleModel.findById(id).lean().exec();
  },

  findByKey(key: string) {
    return ModuleModel.findOne({ key }).lean().exec();
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
};
