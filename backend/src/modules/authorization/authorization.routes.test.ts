import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import { Types } from "mongoose";
import { app } from "../../app.js";
import { clearTestDb, connectTestDb, disconnectTestDb } from "../../database/test-db.js";
import { UserModel } from "../../database/models/index.js";
import { userRepository } from "../users/user.repository.js";
import { roleRepository } from "../roles/role.repository.js";
import { permissionService } from "../permissions/permission.service.js";
import { moduleService } from "../modules/module.service.js";
import { subModuleService } from "../modules/sub-module.service.js";
import { operationService } from "../modules/operation.service.js";
import { rolePermissionRepository } from "../roles/role-permission.repository.js";

const TEST_PASSWORD = "TestPass123!";
const VIEW_KEY = "employee.employees.view";
const CREATE_KEY = "employee.employees.create";
const DELETE_KEY = "employee.employees.delete";

async function createPermission(key: string) {
  const module = await moduleService.ensureModule({ key: "employee", name: "Employee Management" });
  const subModule = await subModuleService.ensureSubModule(module._id, { key: "employees", name: "Employees" });
  const operation = await operationService.ensureOperation(module._id, subModule._id, { key: key.split(".")[2] ?? "view", name: "View" });
  return permissionService.createPermission({
    key,
    name: key,
    moduleId: module._id,
    operationId: operation._id,
  });
}

async function createRole(slug: string, permissionKeys: string[]) {
  const role = await roleRepository.create({ name: slug, slug });
  if (permissionKeys.length > 0) {
    await rolePermissionRepository.insertMany(
      permissionKeys.map((key) => ({ roleId: role._id, permissionKey: key }))
    );
  }
  return role;
}

async function createUser(email: string, roleIds: Types.ObjectId[]) {
  return userRepository.create({
    name: "Test User",
    email,
    passwordHash: bcrypt.hashSync(TEST_PASSWORD, 4),
    roleIds,
    status: "active",
  });
}

async function login(email: string): Promise<string> {
  const res = await request(app)
    .post("/api/v1/auth/login")
    .send({ email, password: TEST_PASSWORD });
  expect(res.status).toBe(200);
  return res.body.data.accessToken;
}

async function getAccess(token: string, method: "get" | "post" | "delete", path: string) {
  const req = request(app)[method](path).set("Authorization", `Bearer ${token}`);
  return method === "post" ? req.send({}) : req;
}

describe("authorization middleware", () => {
  let viewerRole: Types.ObjectId;
  let fullRole: Types.ObjectId;
  let bareRole: Types.ObjectId;

  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    await createPermission(VIEW_KEY);
    await createPermission(CREATE_KEY);
    await createPermission(DELETE_KEY);
    viewerRole = (await createRole("viewer", [VIEW_KEY]))._id;
    fullRole = (await createRole("full", [VIEW_KEY, CREATE_KEY, DELETE_KEY]))._id;
    bareRole = (await createRole("bare", []))._id;
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe("allowed", () => {
    it("allows a user with the required permission", async () => {
      await createUser("viewer@example.com", [viewerRole]);
      const token = await login("viewer@example.com");

      const res = await getAccess(token, "get", "/api/v1/test/employee-view");
      expect(res.status).toBe(200);
      expect(res.body.data.message).toContain("employee.employees.view");
    });

    it("allows a user with multiple permissions on each endpoint", async () => {
      await createUser("full@example.com", [fullRole]);
      const token = await login("full@example.com");

      const view = await getAccess(token, "get", "/api/v1/test/employee-view");
      const create = await getAccess(token, "post", "/api/v1/test/employee-create");
      const del = await getAccess(token, "delete", "/api/v1/test/employee-delete");
      expect(view.status).toBe(200);
      expect(create.status).toBe(200);
      expect(del.status).toBe(200);
    });
  });

  describe("denied", () => {
    it("denies a user without the required permission with 403", async () => {
      await createUser("bare@example.com", [bareRole]);
      const token = await login("bare@example.com");

      const res = await getAccess(token, "get", "/api/v1/test/employee-view");
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("AUTH_FORBIDDEN");
    });

    it("denies when the permission is disabled", async () => {
      await createUser("viewer@example.com", [viewerRole]);
      const token = await login("viewer@example.com");
      await permissionService.setPermissionActive(VIEW_KEY, false);

      const res = await getAccess(token, "get", "/api/v1/test/employee-view");
      expect(res.status).toBe(403);
    });

    it("denies when the role is disabled", async () => {
      await createUser("viewer@example.com", [viewerRole]);
      const token = await login("viewer@example.com");
      await roleRepository.setActive(viewerRole, false);

      const res = await getAccess(token, "get", "/api/v1/test/employee-view");
      expect(res.status).toBe(403);
    });

    it("denies when the role-permission row is disabled", async () => {
      await createUser("viewer@example.com", [viewerRole]);
      const token = await login("viewer@example.com");
      const { RolePermissionModel } = await import("../../database/models/index.js");
      await RolePermissionModel.updateMany(
        { roleId: viewerRole, permissionKey: VIEW_KEY },
        { $set: { enabled: false } }
      ).exec();

      const res = await getAccess(token, "get", "/api/v1/test/employee-view");
      expect(res.status).toBe(403);
    });

    it("denies a disabled user (403 via authentication)", async () => {
      const user = await createUser("viewer@example.com", [viewerRole]);
      const token = await login("viewer@example.com");
      await userRepository.setStatus(user._id, "suspended");

      const res = await getAccess(token, "get", "/api/v1/test/employee-view");
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("AUTH_USER_DISABLED");
    });

    it("returns 401 without an access token", async () => {
      const res = await request(app).get("/api/v1/test/employee-view");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("AUTH_UNAUTHORIZED");
    });
  });

  describe("dynamic changes", () => {
    it("adds a permission and access becomes allowed", async () => {
      await createUser("bare@example.com", [bareRole]);
      const token = await login("bare@example.com");
      expect((await getAccess(token, "get", "/api/v1/test/employee-view")).status).toBe(403);

      await rolePermissionRepository.insertMany([{ roleId: bareRole, permissionKey: VIEW_KEY }]);
      expect((await getAccess(token, "get", "/api/v1/test/employee-view")).status).toBe(200);
    });

    it("removes a permission and access becomes denied", async () => {
      await createUser("viewer@example.com", [viewerRole]);
      const token = await login("viewer@example.com");
      expect((await getAccess(token, "get", "/api/v1/test/employee-view")).status).toBe(200);

      await rolePermissionRepository.deleteByRoleAndKeys(viewerRole, [VIEW_KEY]);
      expect((await getAccess(token, "get", "/api/v1/test/employee-view")).status).toBe(403);
    });

    it("disables a permission and access becomes denied", async () => {
      await createUser("viewer@example.com", [viewerRole]);
      const token = await login("viewer@example.com");
      expect((await getAccess(token, "get", "/api/v1/test/employee-view")).status).toBe(200);

      await permissionService.setPermissionActive(VIEW_KEY, false);
      expect((await getAccess(token, "get", "/api/v1/test/employee-view")).status).toBe(403);
    });

    it("changes the user role and effective permissions change immediately", async () => {
      const user = await createUser("viewer@example.com", [viewerRole]);
      const token = await login("viewer@example.com");
      expect((await getAccess(token, "get", "/api/v1/test/employee-view")).status).toBe(200);

      await userRepository.setRoles(user._id, [bareRole]);
      expect((await getAccess(token, "get", "/api/v1/test/employee-view")).status).toBe(403);

      await userRepository.setRoles(user._id, [fullRole]);
      expect((await getAccess(token, "get", "/api/v1/test/employee-view")).status).toBe(200);
      expect((await getAccess(token, "delete", "/api/v1/test/employee-delete")).status).toBe(200);
    });
  });

  describe("bypass attempts", () => {
    it("ignores client-supplied role IDs in the body", async () => {
      await createUser("bare@example.com", [bareRole]);
      const token = await login("bare@example.com");

      const res = await request(app)
        .post("/api/v1/test/employee-create")
        .set("Authorization", `Bearer ${token}`)
        .send({ roleIds: [fullRole.toString()] });
      expect(res.status).toBe(403);
    });

    it("ignores client-supplied permission arrays in the body", async () => {
      await createUser("bare@example.com", [bareRole]);
      const token = await login("bare@example.com");

      const res = await request(app)
        .post("/api/v1/test/employee-create")
        .set("Authorization", `Bearer ${token}`)
        .send({ permissions: [CREATE_KEY] });
      expect(res.status).toBe(403);
    });

    it("ignores client-supplied user IDs in the body", async () => {
      const fullUser = await createUser("full@example.com", [fullRole]);
      await createUser("bare@example.com", [bareRole]);
      const bareToken = await login("bare@example.com");

      const res = await request(app)
        .post("/api/v1/test/employee-create")
        .set("Authorization", `Bearer ${bareToken}`)
        .send({ userId: fullUser._id.toString() });
      expect(res.status).toBe(403);
    });

    it("cannot grant access by sending a different role ID in the body", async () => {
      await createUser("viewer@example.com", [viewerRole]);
      const token = await login("viewer@example.com");

      const res = await request(app)
        .delete("/api/v1/test/employee-delete")
        .set("Authorization", `Bearer ${token}`)
        .send({ roleIds: [fullRole.toString()] });
      expect(res.status).toBe(403);
    });
  });

  it("rejects when the token belongs to a user that no longer exists", async () => {
    const user = await createUser("viewer@example.com", [viewerRole]);
    const token = await login("viewer@example.com");
    await UserModel.deleteOne({ _id: user._id }).exec();

    const res = await getAccess(token, "get", "/api/v1/test/employee-view");
    expect(res.status).toBe(401);
  });
});
