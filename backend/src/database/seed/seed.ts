import bcrypt from "bcrypt";
import { env } from "../../config/env.js";
import { logger } from "../../shared/logger/logger.js";
import { buildPermissionKey } from "../../shared/utils/slug.js";
import { moduleService } from "../../modules/modules/module.service.js";
import { subModuleService } from "../../modules/modules/sub-module.service.js";
import { operationService } from "../../modules/modules/operation.service.js";
import { permissionService } from "../../modules/permissions/permission.service.js";
import { roleService } from "../../modules/roles/role.service.js";
import { userRepository } from "../../modules/users/user.repository.js";
import {
  SEED_MODULES,
  SEED_ROLES,
  SUPER_ADMIN_ROLE_SLUG,
} from "./data.js";

export interface SeedSummary {
  modules: number;
  subModules: number;
  operations: number;
  permissions: number;
  roles: number;
  rolePermissions: number;
  adminUser: "created" | "updated" | "skipped";
}

const BCRYPT_COST = 12;

export async function runSeed(): Promise<SeedSummary> {
  logger.info("Seeding RBAC hierarchy...");
  let modules = 0;
  let subModules = 0;
  let operations = 0;
  let permissions = 0;

  const allPermissionKeys: string[] = [];

  for (const moduleDef of SEED_MODULES) {
    const module = await moduleService.ensureModule({
      key: moduleDef.key,
      name: moduleDef.name,
      description: moduleDef.description,
      order: moduleDef.order,
      icon: moduleDef.icon,
    });
    modules += 1;

    for (const subModuleDef of moduleDef.subModules) {
      const subModule = await subModuleService.ensureSubModule(module._id, {
        key: subModuleDef.key,
        name: subModuleDef.name,
        order: subModuleDef.order,
      });
      subModules += 1;

      for (const operationDef of subModuleDef.operations) {
        const operation = await operationService.ensureOperation(
          module._id,
          subModule._id,
          {
            key: operationDef.key,
            name: operationDef.name,
            order: operationDef.order,
          }
        );
        operations += 1;

        const permissionKey = buildPermissionKey(
          moduleDef.key,
          operationDef.key,
          subModuleDef.key
        );
        await permissionService.ensurePermission({
          key: permissionKey,
          name: `${operationDef.name} ${subModuleDef.name}`,
          description: `${moduleDef.name} / ${subModuleDef.name}`,
          moduleId: module._id,
          operationId: operation._id,
        });
        permissions += 1;
        allPermissionKeys.push(permissionKey);
      }
    }
  }

  logger.info("Seeding roles and role-permission assignments...");
  let roles = 0;
  let rolePermissions = 0;

  for (const roleDef of SEED_ROLES) {
    const role = await roleService.ensureRole({
      slug: roleDef.slug,
      name: roleDef.name,
      description: roleDef.description,
      isSystem: true,
    });
    roles += 1;

    const keys =
      roleDef.slug === SUPER_ADMIN_ROLE_SLUG ? allPermissionKeys : roleDef.permissionKeys;
    await roleService.assignPermissions(role._id, keys, "ensure");
    const rows = await roleService.getPermissionRows(role._id);
    rolePermissions += rows.length;
  }

  logger.info("Seeding super administrator user...");
  let adminUser: SeedSummary["adminUser"] = "skipped";
  if (env.SEED_ADMIN_EMAIL && env.SEED_ADMIN_PASSWORD) {
    const superAdminRole = await roleService.ensureRole({
      slug: SUPER_ADMIN_ROLE_SLUG,
      name: "Super Administrator",
      description: "Full access to the entire platform",
      isSystem: true,
    });
    const passwordHash = await bcrypt.hash(env.SEED_ADMIN_PASSWORD, BCRYPT_COST);
    const existing = await userRepository.findByEmail(env.SEED_ADMIN_EMAIL);
    await userRepository.upsertByEmail({
      name: "Super Administrator",
      email: env.SEED_ADMIN_EMAIL,
      passwordHash,
      roleIds: [superAdminRole._id],
    });
    adminUser = existing ? "updated" : "created";
  }

  return { modules, subModules, operations, permissions, roles, rolePermissions, adminUser };
}