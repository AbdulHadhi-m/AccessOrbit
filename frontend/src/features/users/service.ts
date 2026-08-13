import { apiFetch } from "@/lib/api/client";
import { serializeQuery } from "@/lib/api/serialize-query";
import type { Paginated, ListParams } from "@/types/api";
import type {
  UserDto,
  CreateUserInput,
  UpdateUserInput,
  SetUserRolesInput,
} from "@/types/users";

export const usersService = {
  list(params: ListParams = {}): Promise<Paginated<UserDto>> {
    return apiFetch<Paginated<UserDto>>(`/api/v1/users${serializeQuery(params)}`);
  },

  get(id: string): Promise<UserDto> {
    return apiFetch<{ user: UserDto }>(`/api/v1/users/${id}`).then((data) => data.user);
  },

  create(input: CreateUserInput): Promise<UserDto> {
    return apiFetch<{ user: UserDto }>("/api/v1/users", {
      method: "POST",
      body: JSON.stringify(input),
    }).then((data) => data.user);
  },

  update(id: string, input: UpdateUserInput): Promise<UserDto> {
    return apiFetch<{ user: UserDto }>(`/api/v1/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }).then((data) => data.user);
  },

  setRoles(id: string, input: SetUserRolesInput): Promise<UserDto> {
    return apiFetch<{ user: UserDto }>(`/api/v1/users/${id}/roles`, {
      method: "POST",
      body: JSON.stringify(input),
    }).then((data) => data.user);
  },

  remove(id: string): Promise<void> {
    return apiFetch<void>(`/api/v1/users/${id}`, { method: "DELETE" });
  },
};