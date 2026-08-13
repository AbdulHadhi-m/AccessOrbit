import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { Types } from "mongoose";
import { app } from "../../app.js";
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
  seedRbacHierarchy,
  TEST_PASSWORD,
} from "../../database/test-helpers.js";
import { userRepository } from "./user.repository.js";

describe("users admin API", () => {
  let admin: { token: string; roleId: Types.ObjectId; userId: Types.ObjectId };
  let plainRole: Types.ObjectId;

  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    admin = await seedAdmin();
    plainRole = await createRole("plain", []);
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe("list users", () => {
    it("returns paginated users with metadata and no sensitive fields", async () => {
      await createUser("jane@example.com", [plainRole]);
      await createUser("john@example.com", [plainRole]);

      const res = await request(app)
        .get("/api/v1/users")
        .set("Authorization", `Bearer ${admin.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(3);
      expect(res.body.data.page).toBe(1);
      expect(res.body.data.limit).toBe(20);
      expect(res.body.data.total).toBe(3);
      expect(res.body.data.totalPages).toBe(1);
      expect(JSON.stringify(res.body)).not.toContain("passwordHash");
      expect(JSON.stringify(res.body)).not.toContain("refreshToken");
      for (const item of res.body.data.items) {
        expect(item).not.toHaveProperty("passwordHash");
      }
    });

    it("supports search, status filtering, and sorting", async () => {
      await createUser("jane@example.com", [plainRole]);
      const suspendedId = await createUser("john@example.com", [plainRole], {
        status: "suspended",
      });

      const search = await request(app)
        .get("/api/v1/users?search=jane")
        .set("Authorization", `Bearer ${admin.token}`);
      expect(search.status).toBe(200);
      expect(search.body.data.total).toBe(1);

      const suspended = await request(app)
        .get("/api/v1/users?status=suspended")
        .set("Authorization", `Bearer ${admin.token}`);
      expect(suspended.status).toBe(200);
      expect(suspended.body.data.total).toBe(1);
      expect(suspended.body.data.items[0].id).toBe(suspendedId.toString());

      const sorted = await request(app)
        .get("/api/v1/users?sort=email&order=asc")
        .set("Authorization", `Bearer ${admin.token}`);
      expect(sorted.status).toBe(200);
      const emails = sorted.body.data.items.map(
        (user: { email: string }) => user.email
      );
      expect([...emails].sort()).toEqual(emails);
    });

    it("rejects invalid query parameters with 422", async () => {
      const res = await request(app)
        .get("/api/v1/users?limit=1000")
        .set("Authorization", `Bearer ${admin.token}`);
      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("create user", () => {
    it("creates a user and returns it without sensitive fields", async () => {
      const res = await request(app)
        .post("/api/v1/users")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          name: "New Person",
          email: "new@example.com",
          password: TEST_PASSWORD,
          roleIds: [plainRole.toString()],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.user.email).toBe("new@example.com");
      expect(res.body.data.user.roles).toHaveLength(1);
      expect(res.body.data.user.roles[0].slug).toBe("plain");
      expect(res.body.data.user).not.toHaveProperty("passwordHash");

      const token = await login("new@example.com");
      expect(token).toBeTruthy();
    });

    it("rejects a duplicate email with 409", async () => {
      await createUser("dup@example.com", [plainRole]);
      const res = await request(app)
        .post("/api/v1/users")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          name: "Duplicate",
          email: "dup@example.com",
          password: "SuperSecret123!",
        });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("CONFLICT");
    });

    it("rejects unknown role ids with 422", async () => {
      const res = await request(app)
        .post("/api/v1/users")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          name: "No Role",
          email: "norole@example.com",
          password: "SuperSecret123!",
          roleIds: [new Types.ObjectId().toString()],
        });
      expect(res.status).toBe(422);
      expect(res.body.error.details[0].field).toBe("roleIds");
    });

    it("rejects invalid input with 422", async () => {
      const res = await request(app)
        .post("/api/v1/users")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ name: "", email: "not-an-email", password: "short" });
      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("update user", () => {
    it("updates name and status", async () => {
      const id = await createUser("upd@example.com", [plainRole]);
      const res = await request(app)
        .patch(`/api/v1/users/${id}`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ name: "Renamed", status: "suspended" });

      expect(res.status).toBe(200);
      expect(res.body.data.user.name).toBe("Renamed");
      expect(res.body.data.user.status).toBe("suspended");
    });

    it("does not allow modifying protected authentication fields", async () => {
      const id = await createUser("prot@example.com", [plainRole]);
      const res = await request(app)
        .patch(`/api/v1/users/${id}`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ passwordHash: "hacked", refreshTokens: [] });
      expect(res.status).toBe(422);
    });

    it("rejects duplicate email with 409", async () => {
      const a = await createUser("a@example.com", [plainRole]);
      await createUser("b@example.com", [plainRole]);
      const res = await request(app)
        .patch(`/api/v1/users/${a}`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ email: "b@example.com" });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("CONFLICT");
    });

    it("rejects self-disable with 409", async () => {
      const res = await request(app)
        .patch(`/api/v1/users/${admin.userId}`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ status: "suspended" });
      expect(res.status).toBe(409);
    });
  });

  describe("assign roles", () => {
    it("assigns roles and they take effect immediately", async () => {
      const allKeys = await seedRbacHierarchy();
      const employeeViewKey = allKeys.find((key) => key === "employee.employees.view");
      expect(employeeViewKey).toBeDefined();
      const viewerRole = await createRole("viewer", [employeeViewKey as string]);
      const id = await createUser("assignee@example.com", [plainRole]);

      const res = await request(app)
        .post(`/api/v1/users/${id}/roles`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ roleIds: [viewerRole.toString()] });
      expect(res.status).toBe(200);
      expect(res.body.data.user.roles).toHaveLength(1);
      expect(res.body.data.user.roles[0].slug).toBe("viewer");

      const token = await login("assignee@example.com");
      const access = await request(app)
        .get("/api/v1/test/employee-view")
        .set("Authorization", `Bearer ${token}`);
      expect(access.status).toBe(200);
    });

    it("rejects unknown roles with 422", async () => {
      const id = await createUser("badassign@example.com", [plainRole]);
      const res = await request(app)
        .post(`/api/v1/users/${id}/roles`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ roleIds: [new Types.ObjectId().toString()] });
      expect(res.status).toBe(422);
    });
  });

  describe("delete user", () => {
    it("deletes a user and revokes their sessions", async () => {
      const id = await createUser("gone@example.com", [plainRole]);
      const res = await request(app)
        .delete(`/api/v1/users/${id}`)
        .set("Authorization", `Bearer ${admin.token}`);
      expect(res.status).toBe(200);

      const found = await userRepository.findById(id);
      expect(found).toBeNull();
    });

    it("rejects self-deletion with 409", async () => {
      const res = await request(app)
        .delete(`/api/v1/users/${admin.userId}`)
        .set("Authorization", `Bearer ${admin.token}`);
      expect(res.status).toBe(409);
    });

    it("returns 404 for a missing user", async () => {
      const res = await request(app)
        .delete(`/api/v1/users/${new Types.ObjectId()}`)
        .set("Authorization", `Bearer ${admin.token}`);
      expect(res.status).toBe(404);
    });
  });

  describe("authorization", () => {
    it("returns 401 without a token", async () => {
      const res = await request(app).get("/api/v1/users");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("AUTH_UNAUTHORIZED");
    });

    it("returns 403 for a user without the permission", async () => {
      await createUser("noperm@example.com", [plainRole]);
      const token = await login("noperm@example.com");
      const res = await request(app)
        .get("/api/v1/users")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("AUTH_FORBIDDEN");
    });

    it("ignores client-supplied role ids and permissions", async () => {
      await createUser("spoof@example.com", [plainRole]);
      const token = await login("spoof@example.com");
      const res = await request(app)
        .get("/api/v1/users?limit=1")
        .set("Authorization", `Bearer ${token}`)
        .set("x-role-ids", "anything")
        .send({ roleIds: [admin.roleId.toString()], permissions: ["rbac.users.view"] });
      expect(res.status).toBe(403);
    });
  });
});