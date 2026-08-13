import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { Types } from "mongoose";
import { auditService } from "./audit.service.js";
import { AuditLogModel } from "../../database/models/index.js";
import {
  clearTestDb,
  connectTestDb,
  disconnectTestDb,
} from "../../database/test-db.js";

describe("auditService", () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe("sanitize", () => {
    it("redacts sensitive fields recursively", () => {
      const input = {
        name: "Test User",
        email: "test@example.com",
        password: "SuperSecret123!",
        passwordHash: "$2b$12$hash",
        nested: {
          token: "secret-token-value",
          refreshToken: "refresh-token-value",
          normalField: "keep-me",
        },
        arr: [{ secret: "shh", visible: "yes" }],
      };

      const sanitized = auditService.sanitize(input);

      expect(sanitized).toEqual({
        name: "Test User",
        email: "test@example.com",
        password: "[REDACTED]",
        passwordHash: "[REDACTED]",
        nested: {
          token: "[REDACTED]",
          refreshToken: "[REDACTED]",
          normalField: "keep-me",
        },
        arr: [{ secret: "[REDACTED]", visible: "yes" }],
      });
    });

    it("handles primitives, dates, and nulls safely", () => {
      const date = new Date();
      expect(auditService.sanitize(null)).toBeNull();
      expect(auditService.sanitize(undefined)).toBeUndefined();
      expect(auditService.sanitize(123)).toBe(123);
      expect(auditService.sanitize("hello")).toBe("hello");
      expect(auditService.sanitize(date)).toBe(date);
    });
  });

  describe("logAudit", () => {
    beforeEach(async () => {
      await clearTestDb();
    });

    it("creates an audit record with sanitized details", async () => {
      const actorId = new Types.ObjectId();
      await auditService.logAudit({
        actor: { id: actorId, email: "admin@example.com", name: "Admin" },
        action: "user.create",
        category: "users",
        targetId: "12345",
        targetType: "user",
        details: { email: "newuser@example.com", password: "SecretPassword123" },
        status: "success",
        ipAddress: "127.0.0.1",
        userAgent: "Vitest/1.0",
        requestId: "req-xyz-123",
      });

      const count = await AuditLogModel.countDocuments();
      expect(count).toBe(1);

      const doc = await AuditLogModel.findOne({ action: "user.create" });
      expect(doc).not.toBeNull();
      expect(doc?.actor?.email).toBe("admin@example.com");
      expect(doc?.category).toBe("users");
      expect(doc?.details).toEqual({ email: "newuser@example.com", password: "[REDACTED]" });
      expect(doc?.ipAddress).toBe("127.0.0.1");
      expect(doc?.requestId).toBe("req-xyz-123");
    });
  });

  describe("listAuditLogs", () => {
    beforeEach(async () => {
      await clearTestDb();
      const actorId = new Types.ObjectId();

      await AuditLogModel.create([
        {
          actor: { id: actorId, email: "user1@example.com", name: "Alice" },
          action: "auth.login.success",
          category: "auth",
          status: "success",
          ipAddress: "10.0.0.1",
          createdAt: new Date("2026-01-01T10:00:00Z"),
        },
        {
          actor: { id: actorId, email: "user1@example.com", name: "Alice" },
          action: "user.create",
          category: "users",
          status: "success",
          ipAddress: "10.0.0.1",
          createdAt: new Date("2026-01-02T10:00:00Z"),
        },
        {
          actor: { email: "user2@example.com", name: "Bob" },
          action: "auth.login.failure",
          category: "auth",
          status: "failure",
          ipAddress: "10.0.0.2",
          createdAt: new Date("2026-01-03T10:00:00Z"),
        },
      ]);
    });

    it("returns paginated records sorted by createdAt desc by default", async () => {
      const res = await auditService.listAuditLogs({ page: 1, limit: 2 });
      expect(res.pagination.total).toBe(3);
      expect(res.pagination.totalPages).toBe(2);
      expect(res.data.length).toBe(2);
      expect(res.data[0].action).toBe("auth.login.failure");
      expect(res.data[1].action).toBe("user.create");
    });

    it("filters by category, status, and search query", async () => {
      const authRes = await auditService.listAuditLogs({ category: "auth" });
      expect(authRes.pagination.total).toBe(2);

      const failRes = await auditService.listAuditLogs({ status: "failure" });
      expect(failRes.pagination.total).toBe(1);
      expect(failRes.data[0].actor?.email).toBe("user2@example.com");

      const searchRes = await auditService.listAuditLogs({ search: "Bob" });
      expect(searchRes.pagination.total).toBe(1);
    });
  });
});
