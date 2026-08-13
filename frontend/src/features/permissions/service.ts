import { apiFetch } from "@/lib/api/client";
import { serializeQuery } from "@/lib/api/serialize-query";
import type { Paginated, ListParams } from "@/types/api";
import type {
  PermissionDto,
  CreatePermissionInput,
  UpdatePermissionInput,
} from "@/types/rbac";

type PermissionCreateResponse = {
  permission: Omit<PermissionDto, "id" | "createdAt" | "updatedAt"> & {
    _id: string;
    createdAt: string;
    updatedAt: string;
  };
};

function normalizePermission(permission: PermissionCreateResponse["permission"]): PermissionDto {
  return {
    ...permission,
    id: permission._id,
  };
}

export const permissionsService = {
  list(params: ListParams = {}): Promise<Paginated<PermissionDto>> {
    return apiFetch<Paginated<PermissionDto>>(`/api/v1/permissions${serializeQuery(params)}`);
  },

  get(id: string): Promise<PermissionDto> {
    return apiFetch<{ permission: PermissionDto }>(`/api/v1/permissions/${id}`).then(
      (data) => data.permission
    );
  },

  create(input: CreatePermissionInput): Promise<PermissionDto> {
    return apiFetch<PermissionCreateResponse>("/api/v1/permissions", {
      method: "POST",
      body: JSON.stringify(input),
    }).then((data) => normalizePermission(data.permission));
  },

  update(id: string, input: UpdatePermissionInput): Promise<PermissionDto> {
    return apiFetch<{ permission: PermissionDto }>(`/api/v1/permissions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }).then((data) => data.permission);
  },

  remove(id: string): Promise<void> {
    return apiFetch<void>(`/api/v1/permissions/${id}`, { method: "DELETE" });
  },
};