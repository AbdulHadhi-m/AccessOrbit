import { moduleRepository, type UpsertModuleInput } from "./module.repository.js";

export const moduleService = {
  ensureModule(input: UpsertModuleInput) {
    return moduleRepository.upsertByKey(input);
  },

  findByKey(key: string) {
    return moduleRepository.findByKey(key);
  },
};
