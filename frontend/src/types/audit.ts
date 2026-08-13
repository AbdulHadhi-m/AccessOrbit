export type AuditStatus = "success" | "failure";

export interface AuditActor {
  id: string | null;
  email: string | null;
  name: string | null;
}

export interface AuditLogDto {
  id: string;
  actor: AuditActor | null;
  action: string;
  category: string;
  targetId: string | null;
  targetType: string | null;
  details: Record<string, unknown>;
  status: AuditStatus;
  ipAddress: string;
  userAgent: string;
  requestId: string;
  createdAt: string;
}

export interface ListAuditLogsParams {
  page?: number;
  limit?: number;
  category?: string;
  action?: string;
  status?: AuditStatus;
  actorId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
