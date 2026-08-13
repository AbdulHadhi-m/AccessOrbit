import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { clearTestDb, connectTestDb, disconnectTestDb } from "../../database/test-db.js";
import { permissionResolutionService } from "./permission-resolution.service.js";
import { roleService } from "../roles/role.service.js";
import { permissionService } from "../permissions/permission.service.js";
import { moduleService } from "../modules/module.service.js";
import { subModuleService } from "../modules/sub-module.service.js";
import { operationService } from "../modules/operation.service.js";
import { userRepository } from "../users/user.repository.js";
import { rolePermissionRepository } from "../roles/role-permission.repository.js";
import { roleRepository } from "../roles/role.repository.js";

async function createPermissions(keys: string[]) {
  const module = await moduleService.ensureModule({ key: "test", name: "Test Module" });
  const subModule = await subModuleService.ensureSubModule(module._id, {
    key: "items",
    name: "Items",
  });
  const operation = await operationService.ensureOperation(module._id, subModule._id, {
    key: "view",
    name: "View",
  });

  for (const key of keys) {
    await permissionService.createPermission({
      key,
      name: key,
      moduleId: module._id,
      operationId: operation._id,
    });
  }
}

describe("permissionResolutionService", () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it("returns an empty set for a user with no roles", async () => {
    const user = await userRepository.create({
      name: "John",
      email: "john@example.com",
      passwordHash: "hash",
      roleIds: [],
    });

    const result = await permissionResolutionService.resolvePermissionsForUser(user._id);
    expect(result.permissions).toEqual([]);
  });

  it("returns the permissions of a single role", async () => {
    await createPermissions(["test.items.view", "test.items.create"]);
    const role = await roleService.createRole({ name: "Editor" });
    await roleService.assignPermissions(role._id, ["test.items.view", "test.items.create"]);
    const user = await userRepository.create({
      name: "John",
      email: "john@example.com",
      passwordHash: "hash",
      roleIds: [role._id],
    });

    const result = await permissionResolutionService.resolvePermissionsForUser(user._id);
    expect(result.permissions.sort()).toEqual(["test.items.create", "test.items.view"]);
  });

  it("unions permissions across multiple roles", async () => {
    await createPermissions(["test.items.view", "test.items.create", "test.items.update"]);
    const roleA = await roleService.createRole({ name: "Role A" });
    const roleB = await roleService.createRole({ name: "Role B" });
    await roleService.assignPermissions(roleA._id, ["test.items.view", "test.items.create"]);
    await roleService.assignPermissions(roleB._id, ["test.items.create", "test.items.update"]);
    const user = await userRepository.create({
      name: "John",
      email: "john@example.com",
      passwordHash: "hash",
      roleIds: [roleA._id, roleB._id],
    });

    const result = await permissionResolutionService.resolvePermissionsForUser(user._id);
    expect(result.permissions.sort()).toEqual([
      "test.items.create",
      "test.items.update",
      "test.items.view",
    ]);
  });

  it("does not grant a disabled permission even when assigned", async () => {
    await createPermissions(["test.items.view", "test.items.create"]);
    const role = await roleService.createRole({ name: "Editor" });
    await roleService.assignPermissions(role._id, ["test.items.view", "test.items.create"]);
    await permissionService.setPermissionActive("test.items.create", false);
    const user = await userRepository.create({
      name: "John",
      email: "john@example.com",
      passwordHash: "hash",
      roleIds: [role._id],
    });

    const result = await permissionResolutionService.resolvePermissionsForUser(user._id);
    expect(result.permissions).toEqual(["test.items.view"]);
  });

  it("does not grant permissions from disabled role-permission rows", async () => {
    await createPermissions(["test.items.view"]);
    const role = await roleService.createRole({ name: "Editor" });
    await roleService.assignPermissions(role._id, ["test.items.view"]);
    await rolePermissionRepository.deleteByRoleAndKeys(role._id, ["test.items.view"]);
    await rolePermissionRepository.insertMany([
      { roleId: role._id, permissionKey: "test.items.view", enabled: false },
    ]);
    const user = await userRepository.create({
      name: "John",
      email: "john@example.com",
      passwordHash: "hash",
      roleIds: [role._id],
    });

    const result = await permissionResolutionService.resolvePermissionsForUser(user._id);
    expect(result.permissions).toEqual([]);
  });

  it("does not grant permissions from a deactivated role", async () => {
    await createPermissions(["test.items.view"]);
    const role = await roleService.createRole({ name: "Editor" });
    await roleService.assignPermissions(role._id, ["test.items.view"]);
    await roleRepository.setActive(role._id, false);
    const user = await userRepository.create({
      name: "John",
      email: "john@example.com",
      passwordHash: "hash",
      roleIds: [role._id],
    });

    const result = await permissionResolutionService.resolvePermissionsForUser(user._id);
    expect(result.permissions).toEqual([]);
  });

  it("throws when the user does not exist", async () => {
    await expect(
      permissionResolutionService.resolvePermissionsForUser("000000000000000000000000")
    ).rejects.toThrow();
  });

  it("reflects permission assignment changes immediately", async () => {
    await createPermissions(["test.items.view"]);
    const role = await roleService.createRole({ name: "Editor" });
    const user = await userRepository.create({
      name: "John",
      email: "john@example.com",
      passwordHash: "hash",
      roleIds: [role._id],
    });

    const before = await permissionResolutionService.resolvePermissionsForUser(user._id);
    expect(before.permissions).toEqual([]);

    await roleService.assignPermissions(role._id, ["test.items.view"]);

    const after = await permissionResolutionService.resolvePermissionsForUser(user._id);
    expect(after.permissions).toEqual(["test.items.view"]);
  });
});