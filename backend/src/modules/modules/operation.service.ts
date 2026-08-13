import { Types } from "mongoose";
import { NotFoundError } from "../../shared/errors/index.js";
import {
  operationRepository,
  type UpsertOperationInput,
} from "./operation.repository.js";
import { moduleRepository } from "./module.repository.js";
import { subModuleRepository } from "./sub-module.repository.js";

export const operationService = {
  async ensureOperation(
    moduleId: string | Types.ObjectId,
    subModuleId: string | Types.ObjectId | null,
    input: UpsertOperationInput
  ) {
    const module = await moduleRepository.findById(moduleId);
    if (!module) {
      throw new NotFoundError("Parent module not found");
    }
    if (subModuleId !== null) {
      const subModule = await subModuleRepository.findById(subModuleId);
      if (!subModule) {
        throw new NotFoundError("Parent sub-module not found");
      }
    }
    return operationRepository.upsertByModuleSubModuleAndKey(moduleId, subModuleId, input);
  },
};
