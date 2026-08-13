import type { Request } from "express";
import { Types } from "mongoose";
import { AuditLogModel, type AuditStatus } from "../../database/models/index.js";
import { logger } from "../../shared/logger/logger.js";

const SENSITIVE_KEYS = new Set([
  "password",
  "passwordhash",
  "token",
  "refreshtoken",
  "accesstoken",
  "secret",
  "creditcard",
  "authorization",
  "cookie",
]);

export function sanitizeAuditData<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data !== "object") {
    return data;
  }

  if (data instanceof Date || data instanceof RegExp) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeAuditData(item)) as unknown as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      result[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      result[key] = sanitizeAuditData(value);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

export interface AuditActorInput {
  id?: string | Types.ObjectId;
  email?: string;
  name?: string;
}

export interface LogAuditOptions {
  req?: Request;
  actor?: AuditActorInput;
  action: string;
  category: string;
  targetId?: string;
  targetType?: string;
  details?: Record<string, unknown>;
  status?: AuditStatus;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

export interface ListAuditLogsQuery {
  page?: number;
  limit?: number;
  category?: string;
  action?: string;
  status?: AuditStatus;
  actorId?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const auditService = {
  sanitize: sanitizeAuditData,

  async logAudit(options: LogAuditOptions): Promise<void> {
    try {
      const {
        req,
        actor: customActor,
        action,
        category,
        targetId,
        targetType,
        details = {},
        status = "success",
        ipAddress: customIp,
        userAgent: customUa,
        requestId: customReqId,
      } = options;

      let actorId: Types.ObjectId | undefined;
      let actorEmail: string | undefined = customActor?.email;
      let actorName: string | undefined = customActor?.name;

      if (customActor?.id) {
        actorId = typeof customActor.id === "string" ? new Types.ObjectId(customActor.id) : customActor.id;
      } else if (req?.user?.id) {
        actorId = new Types.ObjectId(req.user.id);
        actorEmail = actorEmail ?? req.user.email;
        actorName = actorName ?? req.user.name;
      }

      let ipAddress = customIp ?? "";
      let userAgent = customUa ?? "";
      let requestId = customReqId ?? "";

      if (req) {
        if (!ipAddress) {
          const xForwardedFor = req.headers["x-forwarded-for"];
          if (typeof xForwardedFor === "string") {
            ipAddress = xForwardedFor.split(",")[0].trim();
          } else if (Array.isArray(xForwardedFor) && xForwardedFor.length > 0) {
            ipAddress = xForwardedFor[0].trim();
          } else {
            ipAddress = req.ip || req.socket.remoteAddress || "";
          }
        }

        if (!userAgent) {
          userAgent = req.get("user-agent") || "";
        }

        if (!requestId) {
          requestId = req.res?.locals?.requestId || (req.headers["x-request-id"] as string) || "";
        }
      }

      const sanitizedDetails = sanitizeAuditData(details);

      await AuditLogModel.create({
        actor: {
          id: actorId,
          email: actorEmail,
          name: actorName,
        },
        action,
        category,
        targetId: targetId ? String(targetId) : undefined,
        targetType,
        details: sanitizedDetails,
        status,
        ipAddress,
        userAgent,
        requestId,
      });
    } catch (err) {
      logger.error({ err }, "Failed to write audit log entry");
    }
  },

  async listAuditLogs(query: ListAuditLogsQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (query.category) {
      filter.category = query.category;
    }

    if (query.action) {
      filter.action = query.action;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.actorId && Types.ObjectId.isValid(query.actorId)) {
      filter["actor.id"] = new Types.ObjectId(query.actorId);
    }

    if (query.startDate || query.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (query.startDate) {
        dateFilter.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        dateFilter.$lte = new Date(query.endDate);
      }
      filter.createdAt = dateFilter;
    }

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [
        { "actor.email": searchRegex },
        { "actor.name": searchRegex },
        { action: searchRegex },
        { category: searchRegex },
        { targetType: searchRegex },
        { targetId: searchRegex },
      ];
    }

    const sortField = query.sortBy || "createdAt";
    const sortOrder = query.sortOrder === "asc" ? 1 : -1;
    const sort: Record<string, 1 | -1> = { [sortField]: sortOrder };

    const [data, total] = await Promise.all([
      AuditLogModel.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      AuditLogModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    const formattedData = data.map((doc) => ({
      id: doc._id.toString(),
      actor: doc.actor
        ? {
            id: doc.actor.id ? doc.actor.id.toString() : null,
            email: doc.actor.email || null,
            name: doc.actor.name || null,
          }
        : null,
      action: doc.action,
      category: doc.category,
      targetId: doc.targetId || null,
      targetType: doc.targetType || null,
      details: doc.details || {},
      status: doc.status,
      ipAddress: doc.ipAddress || "",
      userAgent: doc.userAgent || "",
      requestId: doc.requestId || "",
      createdAt: doc.createdAt,
    }));

    return {
      data: formattedData,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  },
};
