import { Types } from "mongoose";
import { NotFoundError } from "../../shared/errors/index.js";
import {
  subModuleRepository,
  type UpsertSubModuleInput,
} from "./sub-module.repository.js";
import { moduleRepository } from "./module.repository.js";

export const subModuleService = {
  async ensureSubModule(moduleId: string | Types.ObjectId, input: UpsertSubModuleInput) {
    const parent = await moduleRepository.findById(moduleId);
    if (!parent) {
      throw new NotFoundError("Parent module not found");
    }
    return subModuleRepository.upsertByModuleAndKey(moduleId, input);
  },
};
