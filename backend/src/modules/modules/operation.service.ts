import { Types } from "mongoose";
import { ConflictError, NotFoundError, ValidationError } from "../../shared/errors/index.js";
import { paginationMeta, parseSort } from "../../shared/utils/pagination.js";
import { KEBAB_KEY_PATTERN } from "../../shared/utils/slug.js";
import {
  operationRepository,
  type UpsertOperationInput,
} from "./operation.repository.js";
import { moduleRepository } from "./module.repository.js";
import { subModuleRepository } from "./sub-module.repository.js";
import { permissionRepository } from "../permissions/permission.repository.js";

export interface ListOperationsInput {
  page: number;
  limit: number;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
  status?: "active" | "inactive";
  moduleId?: string;
  subModuleId?: string;
}

export interface UpdateOperationInput {
  name?: string;
  order?: number;
  active?: boolean;
}

const ALLOWED_SORTS = ["name", "key", "order", "createdAt"];

function toOperationDto(operation: Record<string, unknown>) {
  return {
    id: String(operation._id),
    key: operation.key,
    name: operation.name,
    moduleId: String(operation.moduleId),
    subModuleId: operation.subModuleId ? String(operation.subModuleId) : null,
    order: operation.order,
    active: operation.active,
    createdAt: operation.createdAt,
    updatedAt: operation.updatedAt,
  };
}

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

  async createOperation(input: UpsertOperationInput & { moduleId: string; subModuleId?: string | null }) {
    const module = await moduleRepository.findById(input.moduleId);
    if (!module) {
      throw new ValidationError([{ field: "moduleId", message: "Module does not exist" }]);
    }
    let subModuleId: Types.ObjectId | null = null;
    if (input.subModuleId) {
      const subModule = await subModuleRepository.findById(input.subModuleId);
      if (!subModule) {
        throw new ValidationError([
          { field: "subModuleId", message: "Sub-module does not exist" },
        ]);
      }
      if (subModule.moduleId.toString() !== module._id.toString()) {
        throw new ValidationError([
          { field: "subModuleId", message: "Sub-module does not belong to the given module" },
        ]);
      }
      subModuleId = new Types.ObjectId(subModule._id);
    }
    if (!KEBAB_KEY_PATTERN.test(input.key)) {
      throw new ValidationError([
        { field: "key", message: `Invalid operation key format: ${input.key}` },
      ]);
    }
    const existing = await operationRepository.findByModuleSubModuleAndKey(
      module._id,
      subModuleId,
      input.key
    );
    if (existing) {
      throw new ConflictError(
        `Operation "${input.key}" already exists in this module${subModuleId ? " / sub-module" : ""}`
      );
    }
    const created = await operationRepository.create({
      key: input.key,
      name: input.name,
      order: input.order,
      moduleId: new Types.ObjectId(module._id),
      subModuleId,
    });
    return toOperationDto(created.toObject() as unknown as Record<string, unknown>);
  },

  async getOperationById(id: string | Types.ObjectId) {
    const operation = await operationRepository.findById(id);
    if (!operation) {
      throw new NotFoundError("Operation not found");
    }
    return toOperationDto(operation as unknown as Record<string, unknown>);
  },

  async listOperations(input: ListOperationsInput) {
    const { items, total } = await operationRepository.list({
      page: input.page,
      limit: input.limit,
      search: input.search,
      status: input.status,
      moduleId: input.moduleId,
      subModuleId: input.subModuleId,
      sort: parseSort({ sort: input.sort, order: input.order }, ALLOWED_SORTS),
    });
    return {
      items: items.map((operation) => toOperationDto(operation)),
      ...paginationMeta(total, input.page, input.limit),
    };
  },

  async updateOperation(id: string | Types.ObjectId, input: UpdateOperationInput) {
    const operation = await operationRepository.findById(id);
    if (!operation) {
      throw new NotFoundError("Operation not found");
    }
    await operationRepository.updateById(id, input);
    return this.getOperationById(id);
  },

  async deleteOperation(id: string | Types.ObjectId) {
    const operation = await operationRepository.findById(id);
    if (!operation) {
      throw new NotFoundError("Operation not found");
    }
    const permissions = await permissionRepository.countByOperation(id);
    if (permissions > 0) {
      throw new ConflictError("Operation is referenced by permissions and cannot be deleted");
    }
    await operationRepository.deleteById(id);
  },
};