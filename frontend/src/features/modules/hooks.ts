"use client";

import { useQuery, queryKey } from "@/stores/query-store";
import type { ListParams } from "@/types/api";
import { modulesService } from "./service";

export function useModulesList(params: ListParams) {
  return useQuery(queryKey("modules", params), () => modulesService.list(params));
}

export function useModuleOptions() {
  return useQuery("modules:options", () =>
    modulesService.list({ limit: 100, sort: "name" }).then((result) => result.items)
  );
}