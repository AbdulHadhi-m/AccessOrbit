"use client";

import { useQuery, queryKey } from "@/stores/query-store";
import type { ListAuditLogsParams } from "@/types/audit";
import { auditService } from "./service";

export function useAuditLogs(params: ListAuditLogsParams) {
  return useQuery(queryKey("audit-logs", params), () => auditService.list(params));
}
