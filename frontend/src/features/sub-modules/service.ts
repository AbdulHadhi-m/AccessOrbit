import { apiFetch } from "@/lib/api/client";
import { serializeQuery } from "@/lib/api/serialize-query";
import type { Paginated, ListParams } from "@/types/api";
import type {
  SubModuleDto,
  CreateSubModuleInput,
  UpdateSubModuleInput,
} from "@/types/rbac";

export const subModulesService = {
  list(params: ListParams = {}): Promise<Paginated<SubModuleDto>> {
    return apiFetch<Paginated<SubModuleDto>>(`/api/v1/sub-modules${serializeQuery(params)}`);
  },

  get(id: string): Promise<SubModuleDto> {
    return apiFetch<{ subModule: SubModuleDto }>(`/api/v1/sub-modules/${id}`).then(
      (data) => data.subModule
    );
  },

  create(input: CreateSubModuleInput): Promise<SubModuleDto> {
    return apiFetch<{ subModule: SubModuleDto }>("/api/v1/sub-modules", {
      method: "POST",
      body: JSON.stringify(input),
    }).then((data) => data.subModule);
  },

  update(id: string, input: UpdateSubModuleInput): Promise<SubModuleDto> {
    return apiFetch<{ subModule: SubModuleDto }>(`/api/v1/sub-modules/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }).then((data) => data.subModule);
  },

  remove(id: string): Promise<void> {
    return apiFetch<void>(`/api/v1/sub-modules/${id}`, { method: "DELETE" });
  },
};