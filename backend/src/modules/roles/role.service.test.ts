import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { ConflictError, ValidationError } from "../../shared/errors/index.js";
import { clearTestDb, connectTestDb, disconnectTestDb } from "../../database/test-db.js";
import { roleService } from "./role.service.js";
import { rolePermissionRepository } from "./role-permission.repository.js";
import { permissionService } from "../permissions/permission.service.js";
import { moduleService } from "../modules/module.service.js";
import { subModuleService } from "../modules/sub-module.service.js";
import { operationService } from "../modules/operation.service.js";
import { userRepository } from "../users/user.repository.js";

async function createPermission(key: string) {
  const module = await moduleService.ensureModule({ key: key.split(".")[0] ?? "m", name: "M" });
  const subModule = await subModuleService.ensureSubModule(module._id, {
    key: key.split(".")[1] ?? "s",
    name: "S",
  });
  const operation = await operationService.ensureOperation(module._id, subModule._id, {
    key: key.split(".")[2] ?? "view",
    name: "V",
  });
  return permissionService.createPermission({
    key,
    name: key,
    moduleId: module._id,
    operationId: operation._id,
  });
}

describe("roleService", () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it("creates a role with an auto-generated slug", async () => {
    const role = await roleService.createRole({ name: "HR Manager" });

    expect(role.slug).toBe("hr-manager");
    expect(role.active).toBe(true);
    expect(role.isSystem).toBe(false);
  });

  it("prevents two roles with the same slug", async () => {
    await roleService.createRole({ name: "HR Manager" });

    await expect(roleService.createRole({ name: "HR Manager" })).rejects.toBeInstanceOf(
      ConflictError
    );
    await expect(roleService.createRole({ name: "HR  Manager" })).rejects.toBeInstanceOf(
      ConflictError
    );
  });

  it("assigns permissions to a role", async () => {
    await createPermission("test.items.view");
    await createPermission("test.items.create");
    const role = await roleService.createRole({ name: "Editor" });

    await roleService.assignPermissions(role._id, ["test.items.view", "test.items.create"]);

    const rows = await roleService.getPermissionRows(role._id);
    expect(rows).toHaveLength(2);
    const keys = rows.map((row) => row.permissionKey).sort();
    expect(keys).toEqual(["test.items.create", "test.items.view"]);
  });

  it("rejects assigning unknown permission keys", async () => {
    await createPermission("test.items.view");
    const role = await roleService.createRole({ name: "Editor" });

    await expect(
      roleService.assignPermissions(role._id, ["test.items.view", "test.items.nonexistent"])
    ).rejects.toBeInstanceOf(ValidationError);

    const rows = await roleService.getPermissionRows(role._id);
    expect(rows).toHaveLength(0);
  });

  it("rejects assigning a disabled permission", async () => {
    await createPermission("test.items.view");
    await permissionService.setPermissionActive("test.items.view", false);
    const role = await roleService.createRole({ name: "Editor" });

    await expect(
      roleService.assignPermissions(role._id, ["test.items.view"])
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("does not create duplicate role-permission rows on repeated ensure assignment", async () => {
    await createPermission("test.items.view");
    const role = await roleService.createRole({ name: "Editor" });

    await roleService.assignPermissions(role._id, ["test.items.view"], "ensure");
    await roleService.assignPermissions(role._id, ["test.items.view"], "ensure");
    await roleService.assignPermissions(role._id, ["test.items.view", "test.items.view"], "ensure");

    const rows = await roleService.getPermissionRows(role._id);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.permissionKey).toBe("test.items.view");
  });

  it("replace mode removes permissions that are no longer assigned", async () => {
    await createPermission("test.items.view");
    await createPermission("test.items.create");
    const role = await roleService.createRole({ name: "Editor" });

    await roleService.assignPermissions(role._id, ["test.items.view", "test.items.create"]);
    await roleService.assignPermissions(role._id, ["test.items.view"]);

    const rows = await roleService.getPermissionRows(role._id);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.permissionKey).toBe("test.items.view");
  });

  it("rejects assigning permissions to a nonexistent role", async () => {
    await expect(
      roleService.assignPermissions("000000000000000000000000", ["test.items.view"])
    ).rejects.toThrow();
  });

  it("cannot delete system roles", async () => {
    const role = await roleService.ensureRole({
      slug: "system-role",
      name: "System Role",
      isSystem: true,
    });

    await expect(roleService.deleteRole(role._id)).rejects.toBeInstanceOf(ConflictError);
  });

  it("cannot delete a role that is assigned to users", async () => {
    const role = await roleService.createRole({ name: "Assigned Role" });
    await userRepository.create({
      name: "John",
      email: "john@example.com",
      passwordHash: "hash",
      roleIds: [role._id],
    });

    await expect(roleService.deleteRole(role._id)).rejects.toBeInstanceOf(ConflictError);
  });

  it("deletes an unused non-system role together with its permission rows", async () => {
    await createPermission("test.items.view");
    const role = await roleService.createRole({ name: "Temp Role" });
    await roleService.assignPermissions(role._id, ["test.items.view"]);

    await roleService.deleteRole(role._id);

    const rows = await rolePermissionRepository.findByRole(role._id);
    expect(rows).toHaveLength(0);
    await expect(roleService.getPermissionRows(role._id)).rejects.toThrow();
  });
});