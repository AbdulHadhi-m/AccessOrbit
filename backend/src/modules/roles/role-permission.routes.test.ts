import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { Types } from "mongoose";
import { app } from "../../app.js";
import {
  clearTestDb,
  connectTestDb,
  disconnectTestDb,
} from "../../database/test-db.js";
import { PermissionModel, RoleModel } from "../../database/models/index.js";
import {
  createRole,
  createUser,
  login,
  seedAdmin,
  seedRbacHierarchy,
} from "../../database/test-helpers.js";
import { rolePermissionRepository } from "./role-permission.repository.js";

describe("role-permissions API", () => {
  let admin: { token: string; roleId: Types.ObjectId; userId: Types.ObjectId };
  let viewKey: string;
  let createKey: string;

  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    admin = await seedAdmin();
    viewKey = "rbac.roles.view";
    createKey = "rbac.roles.create";
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  async function permissionIdByKey(key: string): Promise<Types.ObjectId> {
    const permission = await PermissionModel.findOne({ key }).exec();
    if (!permission) {
      throw new Error(`Permission ${key} not found`);
    }
    return permission._id;
  }

  describe("assign permission", () => {
    it("assigns a permission to a role", async () => {
      const roleId = await createRole("viewer", []);
      const res = await request(app)
        .post(`/api/v1/roles/${roleId}/permissions`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ permissionKey: viewKey });

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].permissionKey).toBe(viewKey);
      expect(res.body.data.items[0].permission.key).toBe(viewKey);
    });

    it("rejects duplicate assignments with 409", async () => {
      const roleId = await createRole("viewer", [viewKey]);
      const res = await request(app)
        .post(`/api/v1/roles/${roleId}/permissions`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ permissionKey: viewKey });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("CONFLICT");
    });

    it("rejects assigning to a disabled role with 409", async () => {
      const roleId = await createRole("disabled-role", []);
      await RoleModel.updateOne({ _id: roleId }, { $set: { active: false } }).exec();

      const res = await request(app)
        .post(`/api/v1/roles/${roleId}/permissions`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ permissionKey: viewKey });
      expect(res.status).toBe(409);
    });

    it("rejects unknown and disabled permissions with 422", async () => {
      const roleId = await createRole("picker", []);

      const unknown = await request(app)
        .post(`/api/v1/roles/${roleId}/permissions`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ permissionKey: "does.not.exist" });
      expect(unknown.status).toBe(422);
      expect(unknown.body.error.details[0].field).toBe("permissionKey");

      await PermissionModel.updateOne({ key: viewKey }, { $set: { active: false } }).exec();
      const disabled = await request(app)
        .post(`/api/v1/roles/${roleId}/permissions`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ permissionKey: viewKey });
      expect(disabled.status).toBe(422);
    });

    it("rejects a missing role with 404", async () => {
      const res = await request(app)
        .post(`/api/v1/roles/${new Types.ObjectId()}/permissions`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ permissionKey: viewKey });
      expect(res.status).toBe(404);
    });
  });

  describe("list permissions of a role", () => {
    it("returns the assigned permissions with details", async () => {
      const roleId = await createRole("viewer", [viewKey, createKey]);
      const res = await request(app)
        .get(`/api/v1/roles/${roleId}/permissions`)
        .set("Authorization", `Bearer ${admin.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(2);
      const keys = res.body.data.items.map(
        (item: { permissionKey: string }) => item.permissionKey
      );
      expect(keys).toContain(viewKey);
      expect(keys).toContain(createKey);
    });
  });

  describe("remove permission", () => {
    it("removes an assignment", async () => {
      const roleId = await createRole("viewer", [viewKey]);
      const permissionId = await permissionIdByKey(viewKey);

      const res = await request(app)
        .delete(`/api/v1/roles/${roleId}/permissions/${permissionId}`)
        .set("Authorization", `Bearer ${admin.token}`);
      expect(res.status).toBe(200);
      expect(await rolePermissionRepository.findByRoleAndKey(roleId, viewKey)).toBeNull();
    });

    it("returns 404 when the permission is not assigned", async () => {
      const roleId = await createRole("empty-role", []);
      const permissionId = await permissionIdByKey(viewKey);

      const res = await request(app)
        .delete(`/api/v1/roles/${roleId}/permissions/${permissionId}`)
        .set("Authorization", `Bearer ${admin.token}`);
      expect(res.status).toBe(404);
    });

    it("returns 404 for an unknown permission id", async () => {
      const roleId = await createRole("empty-role", []);
      const res = await request(app)
        .delete(`/api/v1/roles/${roleId}/permissions/${new Types.ObjectId()}`)
        .set("Authorization", `Bearer ${admin.token}`);
      expect(res.status).toBe(404);
    });
  });

  describe("immediate authorization effect", () => {
    it("removing a permission immediately revokes API access", async () => {
      const allKeys = await seedRbacHierarchy();
      const employeeViewKey = allKeys.find((key) => key === "employee.employees.view");
      expect(employeeViewKey).toBeDefined();

      const roleId = await createRole("employee-viewer", [employeeViewKey as string]);
      const userId = await createUser("emp@example.com", [roleId]);
      const token = await login("emp@example.com");

      const before = await request(app)
        .get("/api/v1/test/employee-view")
        .set("Authorization", `Bearer ${token}`);
      expect(before.status).toBe(200);

      const permissionId = await permissionIdByKey(employeeViewKey as string);
      const removed = await request(app)
        .delete(`/api/v1/roles/${roleId}/permissions/${permissionId}`)
        .set("Authorization", `Bearer ${admin.token}`);
      expect(removed.status).toBe(200);

      const after = await request(app)
        .get("/api/v1/test/employee-view")
        .set("Authorization", `Bearer ${token}`);
      expect(after.status).toBe(403);
      expect(after.body.error.code).toBe("AUTH_FORBIDDEN");
      expect(userId).toBeTruthy();
    });

    it("adding a permission immediately grants API access", async () => {
      const allKeys = await seedRbacHierarchy();
      const employeeViewKey = allKeys.find((key) => key === "employee.employees.view");
      expect(employeeViewKey).toBeDefined();

      const roleId = await createRole("empty-role", []);
      const userId = await createUser("emp2@example.com", [roleId]);
      const token = await login("emp2@example.com");

      const before = await request(app)
        .get("/api/v1/test/employee-view")
        .set("Authorization", `Bearer ${token}`);
      expect(before.status).toBe(403);

      const assigned = await request(app)
        .post(`/api/v1/roles/${roleId}/permissions`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ permissionKey: employeeViewKey });
      expect(assigned.status).toBe(200);

      const after = await request(app)
        .get("/api/v1/test/employee-view")
        .set("Authorization", `Bearer ${token}`);
      expect(after.status).toBe(200);
      expect(userId).toBeTruthy();
    });
  });
});