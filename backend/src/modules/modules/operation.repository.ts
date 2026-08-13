import { Types } from "mongoose";
import { OperationModel } from "../../database/models/index.js";

export interface UpsertOperationInput {
  key: string;
  name: string;
  order?: number;
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
};
