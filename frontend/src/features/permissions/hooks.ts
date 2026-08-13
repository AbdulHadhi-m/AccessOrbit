"use client";

import { useQuery, queryKey } from "@/lib/query/query-client";
import type { ListParams } from "@/types/api";
import { permissionsService } from "./service";

export function usePermissionsList(params: ListParams) {
  return useQuery(queryKey("permissions", params), () => permissionsService.list(params));
}