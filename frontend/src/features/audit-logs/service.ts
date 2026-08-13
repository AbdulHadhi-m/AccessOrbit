import { apiFetch } from "@/lib/api/client";
import { serializeQuery } from "@/lib/api/serialize-query";
import type { Paginated } from "@/types/api";
import type { AuditLogDto, ListAuditLogsParams } from "@/types/audit";

export const auditService = {
  list(params: ListAuditLogsParams = {}): Promise<Paginated<AuditLogDto>> {
    return apiFetch<Paginated<AuditLogDto>>(`/api/v1/audit-logs${serializeQuery(params)}`);
  },
};
