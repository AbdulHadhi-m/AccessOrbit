import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { clearTestDb, connectTestDb, disconnectTestDb } from "../../database/test-db.js";
import { runSeed } from "./seed.js";
import { SEED_MODULES, SEED_ROLES } from "./data.js";
import {
  ModuleModel,
  SubModuleModel,
  OperationModel,
  PermissionModel,
  RoleModel,
  RolePermissionModel,
  UserModel,
} from "../../database/models/index.js";
import { permissionResolutionService } from "../../modules/authorization/permission-resolution.service.js";
import { SUPER_ADMIN_ROLE_SLUG } from "./data.js";

const expectedPermissions = SEED_MODULES.reduce(
  (acc, module) =>
    acc +
    module.subModules.reduce(
      (acc2, sub) => acc2 + sub.operations.length,
      0
    ),
  0
);

describe("seed system", () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it("seeds the full RBAC hierarchy with correct counts", async () => {
    const summary = await runSeed();

    expect(summary.modules).toBe(SEED_MODULES.length);
    expect(summary.subModules).toBe(
      SEED_MODULES.reduce((acc, m) => acc + m.subModules.length, 0)
    );
    expect(summary.operations).toBe(expectedPermissions);
    expect(summary.permissions).toBe(expectedPermissions);
    expect(summary.roles).toBe(SEED_ROLES.length);
    expect(summary.adminUser).toBe("created");
    expect(summary.demoUser).toBe("created");

    expect(await ModuleModel.countDocuments()).toBe(SEED_MODULES.length);
    expect(await PermissionModel.countDocuments()).toBe(expectedPermissions);
    expect(await RoleModel.countDocuments()).toBe(SEED_ROLES.length);
    expect(await UserModel.countDocuments()).toBe(2);
  });

  it("is idempotent: running twice produces no duplicates", async () => {
    const first = await runSeed();
    const second = await runSeed();

    expect(second.modules).toBe(first.modules);
    expect(second.subModules).toBe(first.subModules);
    expect(second.operations).toBe(first.operations);
    expect(second.permissions).toBe(first.permissions);
    expect(second.roles).toBe(first.roles);
    expect(second.rolePermissions).toBe(first.rolePermissions);
    expect(second.adminUser).toBe("updated");
    expect(second.demoUser).toBe("skipped");

    expect(await ModuleModel.countDocuments()).toBe(SEED_MODULES.length);
    expect(await SubModuleModel.countDocuments()).toBe(
      SEED_MODULES.reduce((acc, m) => acc + m.subModules.length, 0)
    );
    expect(await OperationModel.countDocuments()).toBe(expectedPermissions);
    expect(await PermissionModel.countDocuments()).toBe(expectedPermissions);
    expect(await RoleModel.countDocuments()).toBe(SEED_ROLES.length);
    expect(await UserModel.countDocuments()).toBe(2);
  });

  it("assigns every permission to the super administrator role", async () => {
    await runSeed();

    const superAdmin = await RoleModel.findOne({ slug: SUPER_ADMIN_ROLE_SLUG }).exec();
    expect(superAdmin).not.toBeNull();

    const rows = await RolePermissionModel.find({ roleId: superAdmin?._id }).exec();
    expect(rows).toHaveLength(expectedPermissions);
    expect(new Set(rows.map((row) => row.permissionKey)).size).toBe(expectedPermissions);
  });

  it("creates the super administrator user with full permission resolution", async () => {
    await runSeed();

    const admin = await UserModel.findOne({ email: "admin@accessorbit.test" }).exec();
    expect(admin).not.toBeNull();
    expect(admin?.status).toBe("active");

    const result = await permissionResolutionService.resolvePermissionsForUser(admin!._id);
    expect(result.permissions).toHaveLength(expectedPermissions);
    expect(result.permissions).toContain("rbac.roles.assign-permissions");
    expect(result.permissions).toContain("employee.employees.view");
    expect(result.permissions).toContain("leave.requests.approve");
  });

  it("updates the admin password when env credentials change", async () => {
    const first = await runSeed();
    const firstAdmin = await UserModel.findOne({ email: "admin@accessorbit.test" })
      .select("+passwordHash")
      .exec();
    const second = await runSeed();
    const secondAdmin = await UserModel.findOne({ email: "admin@accessorbit.test" })
      .select("+passwordHash")
      .exec();

    expect(first.adminUser).toBe("created");
    expect(second.adminUser).toBe("updated");
    expect(firstAdmin?.passwordHash).not.toBe(secondAdmin?.passwordHash);
  });

  it("seeded roles are system roles and remain active", async () => {
    await runSeed();

    const roles = await RoleModel.find({}).exec();
    expect(roles).toHaveLength(SEED_ROLES.length);
    for (const role of roles) {
      expect(role.isSystem).toBe(true);
      expect(role.active).toBe(true);
    }
  });
});