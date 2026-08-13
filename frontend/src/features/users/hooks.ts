"use client";

import { useQuery, queryKey } from "@/stores/query-store";
import type { ListParams } from "@/types/api";
import { usersService } from "./service";

export function useUsersList(params: ListParams) {
  return useQuery(queryKey("users", params), () => usersService.list(params));
}