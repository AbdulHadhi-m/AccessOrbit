import { apiFetch } from "@/lib/api/client";
import { serializeQuery } from "@/lib/api/serialize-query";
import type { Paginated, ListParams } from "@/types/api";
import type {
  OperationDto,
  CreateOperationInput,
  UpdateOperationInput,
} from "@/types/rbac";

export const operationsService = {
  list(params: ListParams = {}): Promise<Paginated<OperationDto>> {
    return apiFetch<Paginated<OperationDto>>(`/api/v1/operations${serializeQuery(params)}`);
  },

  get(id: string): Promise<OperationDto> {
    return apiFetch<{ operation: OperationDto }>(`/api/v1/operations/${id}`).then(
      (data) => data.operation
    );
  },

  create(input: CreateOperationInput): Promise<OperationDto> {
    return apiFetch<{ operation: OperationDto }>("/api/v1/operations", {
      method: "POST",
      body: JSON.stringify(input),
    }).then((data) => data.operation);
  },

  update(id: string, input: UpdateOperationInput): Promise<OperationDto> {
    return apiFetch<{ operation: OperationDto }>(`/api/v1/operations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }).then((data) => data.operation);
  },

  remove(id: string): Promise<void> {
    return apiFetch<void>(`/api/v1/operations/${id}`, { method: "DELETE" });
  },
};