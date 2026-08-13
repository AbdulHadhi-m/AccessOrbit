import { apiFetch } from "@/lib/api/client";
import { serializeQuery } from "@/lib/api/serialize-query";
import type { Paginated, ListParams } from "@/types/api";
import type {
  RoleDto,
  CreateRoleInput,
  UpdateRoleInput,
  RolePermissionItem,
  AssignPermissionInput,
} from "@/types/roles";

export const rolesService = {
  list(params: ListParams = {}): Promise<Paginated<RoleDto>> {
    return apiFetch<Paginated<RoleDto>>(`/api/v1/roles${serializeQuery(params)}`);
  },

  get(id: string): Promise<RoleDto> {
    return apiFetch<{ role: RoleDto }>(`/api/v1/roles/${id}`).then((data) => data.role);
  },

  create(input: CreateRoleInput): Promise<RoleDto> {
    return apiFetch<{ role: RoleDto }>("/api/v1/roles", {
      method: "POST",
      body: JSON.stringify(input),
    }).then((data) => data.role);
  },

  update(id: string, input: UpdateRoleInput): Promise<RoleDto> {
    return apiFetch<{ role: RoleDto }>(`/api/v1/roles/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }).then((data) => data.role);
  },

  remove(id: string): Promise<void> {
    return apiFetch<void>(`/api/v1/roles/${id}`, { method: "DELETE" });
  },

  permissions(id: string): Promise<RolePermissionItem[]> {
    return apiFetch<{ items: RolePermissionItem[] }>(
      `/api/v1/roles/${id}/permissions`
    ).then((data) => data.items);
  },

  assignPermission(id: string, input: AssignPermissionInput): Promise<RolePermissionItem[]> {
    return apiFetch<{ items: RolePermissionItem[] }>(`/api/v1/roles/${id}/permissions`, {
      method: "POST",
      body: JSON.stringify(input),
    }).then((data) => data.items);
  },

  removePermission(id: string, permissionId: string): Promise<void> {
    return apiFetch<void>(`/api/v1/roles/${id}/permissions/${permissionId}`, {
      method: "DELETE",
    });
  },
};