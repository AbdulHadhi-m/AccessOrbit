"use client";

import { useQuery, queryKey } from "@/lib/query/query-client";
import type { ListParams } from "@/types/api";
import { rolesService } from "./service";

export function useRolesList(params: ListParams) {
  return useQuery(queryKey("roles", params), () => rolesService.list(params));
}

export function useRoleOptions() {
  return useQuery("roles:options", () =>
    rolesService.list({ limit: 100, sort: "name" }).then((result) => result.items)
  );
}

export function useRolePermissions(roleId: string) {
  return useQuery(`role-permissions:${roleId}`, () => rolesService.permissions(roleId));
}

export function useModuleHierarchy() {
  return useQuery("modules:hierarchy", () => modulesHierarchyFetcher());
}

import { modulesService } from "@/features/modules/service";

async function modulesHierarchyFetcher() {
  return modulesService.hierarchy();
}