import { Types } from "mongoose";
import { ConflictError, NotFoundError, ValidationError } from "../../shared/errors/index.js";
import { paginationMeta, parseSort } from "../../shared/utils/pagination.js";
import { KEBAB_KEY_PATTERN } from "../../shared/utils/slug.js";
import {
  subModuleRepository,
  type UpsertSubModuleInput,
} from "./sub-module.repository.js";
import { moduleRepository } from "./module.repository.js";
import { operationRepository } from "./operation.repository.js";

export interface ListSubModulesInput {
  page: number;
  limit: number;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
  status?: "active" | "inactive";
  moduleId?: string;
}

export interface UpdateSubModuleInput {
  name?: string;
  order?: number;
  active?: boolean;
}

const ALLOWED_SORTS = ["name", "key", "order", "createdAt"];

function toSubModuleDto(subModule: Record<string, unknown>) {
  return {
    id: String(subModule._id),
    key: subModule.key,
    name: subModule.name,
    moduleId: String(subModule.moduleId),
    order: subModule.order,
    active: subModule.active,
    createdAt: subModule.createdAt,
    updatedAt: subModule.updatedAt,
  };
}

export const subModuleService = {
  async ensureSubModule(moduleId: string | Types.ObjectId, input: UpsertSubModuleInput) {
    const parent = await moduleRepository.findById(moduleId);
    if (!parent) {
      throw new NotFoundError("Parent module not found");
    }
    return subModuleRepository.upsertByModuleAndKey(moduleId, input);
  },

  async createSubModule(input: UpsertSubModuleInput & { moduleId: string }) {
    const module = await moduleRepository.findById(input.moduleId);
    if (!module) {
      throw new ValidationError([
        { field: "moduleId", message: "Module does not exist" },
      ]);
    }
    if (!KEBAB_KEY_PATTERN.test(input.key)) {
      throw new ValidationError([
        { field: "key", message: `Invalid sub-module key format: ${input.key}` },
      ]);
    }
    const existing = await subModuleRepository.findByModuleAndKey(module._id, input.key);
    if (existing) {
      throw new ConflictError(
        `Sub-module "${input.key}" already exists in module "${module.key}"`
      );
    }
    const created = await subModuleRepository.create({
      key: input.key,
      name: input.name,
      order: input.order,
      moduleId: new Types.ObjectId(module._id),
    });
    return toSubModuleDto(created.toObject() as unknown as Record<string, unknown>);
  },

  async getSubModuleById(id: string | Types.ObjectId) {
    const subModule = await subModuleRepository.findById(id);
    if (!subModule) {
      throw new NotFoundError("Sub-module not found");
    }
    return toSubModuleDto(subModule as unknown as Record<string, unknown>);
  },

  async listSubModules(input: ListSubModulesInput) {
    const { items, total } = await subModuleRepository.list({
      page: input.page,
      limit: input.limit,
      search: input.search,
      status: input.status,
      moduleId: input.moduleId,
      sort: parseSort({ sort: input.sort, order: input.order }, ALLOWED_SORTS),
    });
    return {
      items: items.map((subModule) => toSubModuleDto(subModule)),
      ...paginationMeta(total, input.page, input.limit),
    };
  },

  async updateSubModule(id: string | Types.ObjectId, input: UpdateSubModuleInput) {
    const subModule = await subModuleRepository.findById(id);
    if (!subModule) {
      throw new NotFoundError("Sub-module not found");
    }
    await subModuleRepository.updateById(id, input);
    return this.getSubModuleById(id);
  },

  async deleteSubModule(id: string | Types.ObjectId) {
    const subModule = await subModuleRepository.findById(id);
    if (!subModule) {
      throw new NotFoundError("Sub-module not found");
    }
    const operations = await operationRepository.countBySubModule(id);
    if (operations > 0) {
      throw new ConflictError("Sub-module has operations and cannot be deleted");
    }
    await subModuleRepository.deleteById(id);
  },
};