import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { AuditLogModel } from "../../database/models/index.js";
import {
  clearTestDb,
  connectTestDb,
  disconnectTestDb,
} from "../../database/test-db.js";
import {
  createRole,
  createUser,
  login,
  seedAdmin,
  TEST_PASSWORD,
} from "../../database/test-helpers.js";

describe("Audit Logs Router - GET /api/v1/audit-logs", () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it("returns 401 Unauthorized if no Bearer token is provided", async () => {
    const res = await request(app).get("/api/v1/audit-logs");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("AUTH_UNAUTHORIZED");
  });

  it("returns 403 Forbidden if user lacks audit.view permission", async () => {
    const roleId = await createRole("plain-user", ["rbac.users.view"]);
    await createUser("plain@example.com", [roleId]);
    const token = await login("plain@example.com");

    const res = await request(app)
      .get("/api/v1/audit-logs")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("AUTH_FORBIDDEN");
  });

  it("returns 200 OK with paginated list for Super Admin", async () => {
    const admin = await seedAdmin();

    await AuditLogModel.create({
      action: "user.create",
      category: "users",
      status: "success",
      actor: { id: admin.userId, email: "admin@example.com", name: "Admin" },
      details: { email: "created@example.com" },
    });

    const res = await request(app)
      .get("/api/v1/audit-logs")
      .set("Authorization", `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.pagination.total).toBe(1);
    expect(res.body.data.data[0].action).toBe("user.create");
    expect(res.body.data.data[0].category).toBe("users");
  });

  it("allows auditing role with audit.view permission to access logs", async () => {
    const auditorRoleId = await createRole("auditor-role", ["audit.view"]);
    await createUser("auditor@example.com", [auditorRoleId]);
    const auditorToken = await login("auditor@example.com");

    const res = await request(app)
      .get("/api/v1/audit-logs")
      .set("Authorization", `Bearer ${auditorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.pagination).toBeDefined();
  });

  it("validates query parameters and returns 422 for invalid status", async () => {
    const admin = await seedAdmin();

    const res = await request(app)
      .get("/api/v1/audit-logs?status=invalid_status")
      .set("Authorization", `Bearer ${admin.token}`);

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("filters audit logs by category, action, and search query", async () => {
    const admin = await seedAdmin();

    await AuditLogModel.create([
      {
        action: "auth.login.success",
        category: "auth",
        status: "success",
        actor: { email: "target@example.com" },
      },
      {
        action: "role.create",
        category: "roles",
        status: "success",
        actor: { email: "other@example.com" },
      },
    ]);

    const filterRes = await request(app)
      .get("/api/v1/audit-logs?category=auth")
      .set("Authorization", `Bearer ${admin.token}`);

    expect(filterRes.status).toBe(200);
    expect(filterRes.body.data.data.length).toBe(1);
    expect(filterRes.body.data.data[0].category).toBe("auth");

    const searchRes = await request(app)
      .get("/api/v1/audit-logs?search=target@example.com")
      .set("Authorization", `Bearer ${admin.token}`);

    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.data.length).toBe(1);
    expect(searchRes.body.data.data[0].actor.email).toBe("target@example.com");
  });

  it("enforces read-only API and rejects POST requests with 404", async () => {
    const admin = await seedAdmin();

    const res = await request(app)
      .post("/api/v1/audit-logs")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ action: "hack" });

    expect(res.status).toBe(404);
  });

  it("records audit logs automatically on auth login failure and success", async () => {
    const roleId = await createRole("user-role", []);
    await createUser("user@example.com", [roleId]);

    // Failed login
    await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "user@example.com", password: "wrongpassword" });

    const failedLog = await AuditLogModel.findOne({ action: "auth.login.failure" });
    expect(failedLog).not.toBeNull();
    expect(failedLog?.status).toBe("failure");

    // Successful login
    await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "user@example.com", password: TEST_PASSWORD });

    const successLog = await AuditLogModel.findOne({ action: "auth.login.success" });
    expect(successLog).not.toBeNull();
    expect(successLog?.status).toBe("success");
    expect(successLog?.details?.password).toBeUndefined();
  });
});
