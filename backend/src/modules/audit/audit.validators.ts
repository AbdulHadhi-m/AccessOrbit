import { z } from "zod";
import { AUDIT_STATUSES } from "../../database/models/index.js";

export const listAuditLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.string().trim().optional(),
  action: z.string().trim().optional(),
  status: z.enum(AUDIT_STATUSES).optional(),
  actorId: z.string().trim().optional(),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
  search: z.string().trim().optional(),
  sortBy: z.enum(["createdAt", "action", "category", "status"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
