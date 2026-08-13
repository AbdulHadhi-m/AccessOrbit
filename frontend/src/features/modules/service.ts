import { apiFetch } from "@/lib/api/client";
import { serializeQuery } from "@/lib/api/serialize-query";
import type { Paginated, ListParams } from "@/types/api";
import type {
  ModuleDto,
  CreateModuleInput,
  UpdateModuleInput,
  HierarchyModule,
} from "@/types/rbac";

export const modulesService = {
  list(params: ListParams = {}): Promise<Paginated<ModuleDto>> {
    return apiFetch<Paginated<ModuleDto>>(`/api/v1/modules${serializeQuery(params)}`);
  },

  get(id: string): Promise<ModuleDto> {
    return apiFetch<{ module: ModuleDto }>(`/api/v1/modules/${id}`).then((data) => data.module);
  },

  hierarchy(): Promise<HierarchyModule[]> {
    return apiFetch<{ modules: HierarchyModule[] }>("/api/v1/modules/hierarchy").then(
      (data) => data.modules
    );
  },

  create(input: CreateModuleInput): Promise<ModuleDto> {
    return apiFetch<{ module: ModuleDto }>("/api/v1/modules", {
      method: "POST",
      body: JSON.stringify(input),
    }).then((data) => data.module);
  },

  update(id: string, input: UpdateModuleInput): Promise<ModuleDto> {
    return apiFetch<{ module: ModuleDto }>(`/api/v1/modules/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }).then((data) => data.module);
  },

  remove(id: string): Promise<void> {
    return apiFetch<void>(`/api/v1/modules/${id}`, { method: "DELETE" });
  },
};