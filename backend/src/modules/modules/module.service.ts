import { Types } from "mongoose";
import { ConflictError, NotFoundError, ValidationError } from "../../shared/errors/index.js";
import { paginationMeta, parseSort } from "../../shared/utils/pagination.js";
import { KEBAB_KEY_PATTERN } from "../../shared/utils/slug.js";
import { moduleRepository, type UpsertModuleInput } from "./module.repository.js";
import { subModuleRepository } from "./sub-module.repository.js";
import { operationRepository } from "./operation.repository.js";
import { permissionRepository } from "../permissions/permission.repository.js";

export interface ListModulesInput {
  page: number;
  limit: number;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
  status?: "active" | "inactive";
}

export interface UpdateModuleInput {
  name?: string;
  description?: string;
  order?: number;
  icon?: string;
  active?: boolean;
}

const ALLOWED_SORTS = ["name", "key", "order", "createdAt"];

function toModuleDto(module: Record<string, unknown>) {
  return {
    id: String(module._id),
    key: module.key,
    name: module.name,
    description: module.description,
    order: module.order,
    icon: module.icon,
    active: module.active,
    createdAt: module.createdAt,
    updatedAt: module.updatedAt,
  };
}

export const moduleService = {
  ensureModule(input: UpsertModuleInput) {
    return moduleRepository.upsertByKey(input);
  },

  findByKey(key: string) {
    return moduleRepository.findByKey(key);
  },

  async createModule(input: UpsertModuleInput) {
    if (!KEBAB_KEY_PATTERN.test(input.key)) {
      throw new ValidationError([
        { field: "key", message: `Invalid module key format: ${input.key}` },
      ]);
    }
    const existing = await moduleRepository.findByKey(input.key);
    if (existing) {
      throw new ConflictError(`Module "${input.key}" already exists`);
    }
    const created = await moduleRepository.create(input);
    return toModuleDto(created.toObject() as unknown as Record<string, unknown>);
  },

  async getModuleById(id: string | Types.ObjectId) {
    const module = await moduleRepository.findById(id);
    if (!module) {
      throw new NotFoundError("Module not found");
    }
    return toModuleDto(module as unknown as Record<string, unknown>);
  },

  async listModules(input: ListModulesInput) {
    const { items, total } = await moduleRepository.list({
      page: input.page,
      limit: input.limit,
      search: input.search,
      status: input.status,
      sort: parseSort({ sort: input.sort, order: input.order }, ALLOWED_SORTS),
    });
    return {
      items: items.map((module) => toModuleDto(module)),
      ...paginationMeta(total, input.page, input.limit),
    };
  },

  async updateModule(id: string | Types.ObjectId, input: UpdateModuleInput) {
    const module = await moduleRepository.findById(id);
    if (!module) {
      throw new NotFoundError("Module not found");
    }
    await moduleRepository.updateById(id, input);
    return this.getModuleById(id);
  },

  async deleteModule(id: string | Types.ObjectId) {
    const module = await moduleRepository.findById(id);
    if (!module) {
      throw new NotFoundError("Module not found");
    }
    const [subModules, operations, permissions] = await Promise.all([
      subModuleRepository.countByModule(id),
      operationRepository.countByModule(id),
      permissionRepository.countByModule(id),
    ]);
    if (subModules > 0 || operations > 0 || permissions > 0) {
      throw new ConflictError(
        "Module is referenced by sub-modules, operations, or permissions and cannot be deleted"
      );
    }
    await moduleRepository.deleteById(id);
  },

  async getHierarchy() {
    const modules = await moduleRepository.findAll();
    if (modules.length === 0) {
      return { modules: [] };
    }
    const moduleIds = modules.map((module) => module._id);
    const [subModules, operations, permissions] = await Promise.all([
      subModuleRepository.findByModuleIds(moduleIds),
      operationRepository.findByModuleIds(moduleIds),
      operationRepository
        .findByModuleIds(moduleIds)
        .then((ops) => permissionRepository.findByOperationIds(ops.map((operation) => operation._id))),
    ]);

    const subModulesByModule = new Map<string, typeof subModules>();
    for (const subModule of subModules) {
      const key = subModule.moduleId.toString();
      const list = subModulesByModule.get(key) ?? [];
      list.push(subModule);
      subModulesByModule.set(key, list);
    }

    const operationsByModule = new Map<string, typeof operations>();
    const operationsBySubModule = new Map<string, typeof operations>();
    for (const operation of operations) {
      const moduleKey = operation.moduleId.toString();
      const moduleList = operationsByModule.get(moduleKey) ?? [];
      moduleList.push(operation);
      operationsByModule.set(moduleKey, moduleList);
      if (operation.subModuleId) {
        const subModuleKey = operation.subModuleId.toString();
        const subModuleList = operationsBySubModule.get(subModuleKey) ?? [];
        subModuleList.push(operation);
        operationsBySubModule.set(subModuleKey, subModuleList);
      }
    }

    const permissionsByOperation = new Map<string, typeof permissions>();
    for (const permission of permissions) {
      const key = permission.operationId.toString();
      const list = permissionsByOperation.get(key) ?? [];
      list.push(permission);
      permissionsByOperation.set(key, list);
    }

    const serializeOperation = (operation: (typeof operations)[number]) => ({
      id: operation._id.toString(),
      key: operation.key,
      name: operation.name,
      order: operation.order,
      active: operation.active,
      permissions: (permissionsByOperation.get(operation._id.toString()) ?? []).map((permission) => ({
        id: permission._id.toString(),
        key: permission.key,
        name: permission.name,
        description: permission.description,
        active: permission.active,
      })),
    });

    return {
      modules: modules.map((module) => ({
        id: module._id.toString(),
        key: module.key,
        name: module.name,
        description: module.description,
        order: module.order,
        icon: module.icon,
        active: module.active,
        operations: (operationsByModule.get(module._id.toString()) ?? [])
          .filter((operation) => operation.subModuleId === null)
          .map(serializeOperation),
        subModules: (subModulesByModule.get(module._id.toString()) ?? []).map((subModule) => ({
          id: subModule._id.toString(),
          key: subModule.key,
          name: subModule.name,
          order: subModule.order,
          active: subModule.active,
          operations: (operationsBySubModule.get(subModule._id.toString()) ?? []).map(
            serializeOperation
          ),
        })),
      })),
    };
  },
};