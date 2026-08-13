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
} from "../../database/test-helpers.js";
import { roleRepository } from "./role.repository.js";
import { rolePermissionRepository } from "./role-permission.repository.js";

describe("roles admin API", () => {
  let admin: { token: string; roleId: Types.ObjectId; userId: Types.ObjectId };
  let viewKey: string;

  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    admin = await seedAdmin();
    viewKey = "rbac.roles.view";
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe("create role", () => {
    it("creates a role and derives the slug from the name", async () => {
      const res = await request(app)
        .post("/api/v1/roles")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ name: "Payroll Admin", description: "Handles payroll" });

      expect(res.status).toBe(201);
      expect(res.body.data.role.slug).toBe("payroll-admin");
      expect(res.body.data.role.isSystem).toBe(false);
      expect(res.body.data.role.permissionKeys).toEqual([]);
    });

    it("assigns permission keys on creation", async () => {
      const res = await request(app)
        .post("/api/v1/roles")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ name: "Role Viewer", permissionKeys: [viewKey] });

      expect(res.status).toBe(201);
      expect(res.body.data.role.permissionKeys).toContain(viewKey);
    });

    it("rejects duplicate slugs with 409", async () => {
      await createRole("payroll-admin", []);
      const res = await request(app)
        .post("/api/v1/roles")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ name: "Payroll Admin" });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("CONFLICT");
    });

    it("rejects unknown permission keys with 422", async () => {
      const res = await request(app)
        .post("/api/v1/roles")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ name: "Bad Role", permissionKeys: ["nope.nothing.view"] });
      expect(res.status).toBe(422);
      expect(res.body.error.details[0].field).toBe("permissionKeys");
    });
  });

  describe("list and get roles", () => {
    it("lists roles with their permission keys and pagination metadata", async () => {
      const viewerRoleId = await createRole("viewer", [viewKey]);

      const res = await request(app)
        .get("/api/v1/roles")
        .set("Authorization", `Bearer ${admin.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(2);
      expect(res.body.data.totalPages).toBe(1);
      const viewer = res.body.data.items.find(
        (role: { slug: string }) => role.slug === "viewer"
      );
      expect(viewer.id).toBe(viewerRoleId.toString());
      expect(viewer.permissionKeys).toContain(viewKey);
    });

    it("gets a single role with permission keys", async () => {
      const viewerRoleId = await createRole("viewer", [viewKey]);
      const res = await request(app)
        .get(`/api/v1/roles/${viewerRoleId}`)
        .set("Authorization", `Bearer ${admin.token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.role.permissionKeys).toContain(viewKey);
    });

    it("returns 404 for a missing role", async () => {
      const res = await request(app)
        .get(`/api/v1/roles/${new Types.ObjectId()}`)
        .set("Authorization", `Bearer ${admin.token}`);
      expect(res.status).toBe(404);
    });
  });

  describe("update role", () => {
    it("updates name and regenerates the slug", async () => {
      const id = await createRole("old-name", []);
      const res = await request(app)
        .patch(`/api/v1/roles/${id}`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ name: "New Name" });

      expect(res.status).toBe(200);
      expect(res.body.data.role.name).toBe("New Name");
      expect(res.body.data.role.slug).toBe("new-name");
    });

    it("rejects a rename that collides with another role", async () => {
      const id = await createRole("taken", []);
      await createRole("other", []);
      const res = await request(app)
        .patch(`/api/v1/roles/${id}`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ name: "Other" });
      expect(res.status).toBe(409);
    });

    it("allows disabling a role", async () => {
      const id = await createRole("disable-me", []);
      const res = await request(app)
        .patch(`/api/v1/roles/${id}`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ active: false });
      expect(res.status).toBe(200);
      expect(res.body.data.role.active).toBe(false);
    });
  });

  describe("delete role", () => {
    it("deletes an unused role and its permission rows", async () => {
      const id = await createRole("disposable", [viewKey]);
      const res = await request(app)
        .delete(`/api/v1/roles/${id}`)
        .set("Authorization", `Bearer ${admin.token}`);
      expect(res.status).toBe(200);
      expect(await roleRepository.findById(id)).toBeNull();
      expect(await rolePermissionRepository.findByRole(id)).toHaveLength(0);
    });

    it("rejects deleting a system role with 409", async () => {
      const id = await createRole("system-role", [], { isSystem: true });
      const res = await request(app)
        .delete(`/api/v1/roles/${id}`)
        .set("Authorization", `Bearer ${admin.token}`);
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("CONFLICT");
    });

    it("rejects deleting a role assigned to users with 409", async () => {
      const id = await createRole("in-use", []);
      await createUser("holder@example.com", [id]);
      const res = await request(app)
        .delete(`/api/v1/roles/${id}`)
        .set("Authorization", `Bearer ${admin.token}`);
      expect(res.status).toBe(409);
    });
  });

  describe("authorization", () => {
    it("returns 401 without a token and 403 without permission", async () => {
      const noToken = await request(app).post("/api/v1/roles").send({ name: "X" });
      expect(noToken.status).toBe(401);

      const employeeViewKey = (await seedRbacHierarchy()).find(
        (key) => key === "employee.employees.view"
      );
      const employeeRole = await createRole("employee-viewer", [employeeViewKey as string]);
      await createUser("rbacless@example.com", [employeeRole]);
      const token = await login("rbacless@example.com");

      const res = await request(app)
        .post("/api/v1/roles")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Should Fail" });
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("AUTH_FORBIDDEN");
    });
  });
});