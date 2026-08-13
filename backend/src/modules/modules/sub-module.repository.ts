import { Types } from "mongoose";
import { SubModuleModel } from "../../database/models/index.js";

export interface UpsertSubModuleInput {
  key: string;
  name: string;
  order?: number;
}

export const subModuleRepository = {
  findById(id: string | Types.ObjectId) {
    return SubModuleModel.findById(id).lean().exec();
  },

  findByModuleAndKey(moduleId: string | Types.ObjectId, key: string) {
    return SubModuleModel.findOne({ moduleId, key }).lean().exec();
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
};
