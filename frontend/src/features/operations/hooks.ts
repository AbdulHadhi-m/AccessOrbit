"use client";

import { useQuery, queryKey } from "@/lib/query/query-client";
import type { ListParams } from "@/types/api";
import { operationsService } from "./service";

export function useOperationsList(params: ListParams) {
  return useQuery(queryKey("operations", params), () => operationsService.list(params));
}

export function useOperationOptions() {
  return useQuery("operations:options", () =>
    operationsService.list({ limit: 100, sort: "name" }).then((result) => result.items)
  );
}