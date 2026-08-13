"use client";

import { useQuery, queryKey } from "@/stores/query-store";
import type { ListParams } from "@/types/api";
import { subModulesService } from "./service";

export function useSubModulesList(params: ListParams) {
  return useQuery(queryKey("sub-modules", params), () => subModulesService.list(params));
}

export function useSubModuleOptions() {
  return useQuery("sub-modules:options", () =>
    subModulesService.list({ limit: 100, sort: "name" }).then((result) => result.items)
  );
}