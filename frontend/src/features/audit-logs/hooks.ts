"use client";

import { useQuery, queryKey } from "@/lib/query/query-client";
import type { ListAuditLogsParams } from "@/types/audit";
import { auditService } from "./service";

export function useAuditLogs(params: ListAuditLogsParams) {
  return useQuery(queryKey("audit-logs", params), () => auditService.list(params));
}
