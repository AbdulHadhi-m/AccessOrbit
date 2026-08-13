import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { ConflictError, ValidationError } from "../../shared/errors/index.js";
import { clearTestDb, connectTestDb, disconnectTestDb } from "../../database/test-db.js";
import { moduleService } from "../modules/module.service.js";
import { subModuleService } from "../modules/sub-module.service.js";
import { operationService } from "../modules/operation.service.js";
import { permissionService } from "./permission.service.js";
import { permissionRepository } from "./permission.repository.js";

async function createPermissionFixture() {
  const module = await moduleService.ensureModule({ key: "test", name: "Test Module" });
  const subModule = await subModuleService.ensureSubModule(module._id, {
    key: "items",
    name: "Items",
  });
  const operation = await operationService.ensureOperation(module._id, subModule._id, {
    key: "view",
    name: "View",
  });
  return { module, subModule, operation };
}

describe("permissionService", () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it("creates a permission with a valid key", async () => {
    const { module, operation } = await createPermissionFixture();

    const created = await permissionService.createPermission({
      key: "test.items.view",
      name: "View Items",
      moduleId: module._id,
      operationId: operation._id,
    });

    expect(created.key).toBe("test.items.view");
    const stored = await permissionService.findByKey("test.items.view");
    expect(stored).not.toBeNull();
    expect(stored?.name).toBe("View Items");
  });

  it("rejects an invalid permission key format", async () => {
    const { module, operation } = await createPermissionFixture();

    await expect(
      permissionService.createPermission({
        key: "Uppercase.Key",
        name: "Invalid",
        moduleId: module._id,
        operationId: operation._id,
      })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("prevents duplicate permission keys", async () => {
    const { module, operation } = await createPermissionFixture();

    await permissionService.createPermission({
      key: "test.items.view",
      name: "View Items",
      moduleId: module._id,
      operationId: operation._id,
    });

    await expect(
      permissionService.createPermission({
        key: "test.items.view",
        name: "View Items Again",
        moduleId: module._id,
        operationId: operation._id,
      })
    ).rejects.toBeInstanceOf(ConflictError);

    const count = await permissionRepository.findActiveKeysByKeys(["test.items.view"]);
    expect(count).toHaveLength(1);
  });

  it("rejects a permission whose operation belongs to a different module", async () => {
    const { operation } = await createPermissionFixture();
    const otherModule = await moduleService.ensureModule({ key: "other", name: "Other Module" });

    await expect(
      permissionService.createPermission({
        key: "other.items.view",
        name: "Mismatched",
        moduleId: otherModule._id,
        operationId: operation._id,
      })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("updates mutable fields but never the key", async () => {
    const { module, operation } = await createPermissionFixture();

    await permissionService.createPermission({
      key: "test.items.view",
      name: "View Items",
      moduleId: module._id,
      operationId: operation._id,
    });

    await permissionService.updatePermission("test.items.view", {
      name: "View All Items",
      description: "updated",
    });

    const stored = await permissionService.findByKey("test.items.view");
    expect(stored?.name).toBe("View All Items");
    expect(stored?.description).toBe("updated");
  });

  it("disabling a permission keeps the definition but hides it from active lookup", async () => {
    const { module, operation } = await createPermissionFixture();

    await permissionService.createPermission({
      key: "test.items.view",
      name: "View Items",
      moduleId: module._id,
      operationId: operation._id,
    });

    await permissionService.setPermissionActive("test.items.view", false);

    const stored = await permissionService.findByKey("test.items.view");
    expect(stored).not.toBeNull();
    expect(stored?.active).toBe(false);

    const active = await permissionRepository.findActiveByKey("test.items.view");
    expect(active).toBeNull();
  });

  it("enables a previously disabled permission", async () => {
    const { module, operation } = await createPermissionFixture();

    await permissionService.createPermission({
      key: "test.items.view",
      name: "View Items",
      moduleId: module._id,
      operationId: operation._id,
    });
    await permissionService.setPermissionActive("test.items.view", false);
    await permissionService.setPermissionActive("test.items.view", true);

    const active = await permissionRepository.findActiveByKey("test.items.view");
    expect(active).not.toBeNull();
  });

  it("fails to enable a permission that does not exist", async () => {
    await expect(permissionService.setPermissionActive("missing.view", true)).rejects.toThrow();
  });
});