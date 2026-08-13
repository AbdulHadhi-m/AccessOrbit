"use client";

import { useQuery, queryKey } from "@/stores/query-store";
import type { ListParams } from "@/types/api";
import { permissionsService } from "./service";

export function usePermissionsList(params: ListParams) {
  return useQuery(queryKey("permissions", params), () => permissionsService.list(params));
}