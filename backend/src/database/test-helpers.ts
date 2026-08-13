import bcrypt from "bcrypt";
import { Types } from "mongoose";
import request from "supertest";
import { app } from "../app.js";
import { SEED_MODULES, SUPER_ADMIN_ROLE_SLUG } from "./seed/data.js";
import { moduleService } from "../modules/modules/module.service.js";
import { subModuleService } from "../modules/modules/sub-module.service.js";
import { operationService } from "../modules/modules/operation.service.js";
import { permissionService } from "../modules/permissions/permission.service.js";
import { roleRepository } from "../modules/roles/role.repository.js";
import { rolePermissionRepository } from "../modules/roles/role-permission.repository.js";
import { userRepository } from "../modules/users/user.repository.js";
import { buildPermissionKey } from "../shared/utils/slug.js";

export const TEST_PASSWORD = "TestPass123!";
const TEST_BCRYPT_COST = 4;

export async function seedRbacHierarchy(): Promise<string[]> {
  const allKeys: string[] = [];
  for (const moduleDef of SEED_MODULES) {
    const module = await moduleService.ensureModule({
      key: moduleDef.key,
      name: moduleDef.name,
      description: moduleDef.description,
      order: moduleDef.order,
      icon: moduleDef.icon,
    });
    for (const subModuleDef of moduleDef.subModules) {
      const subModule = await subModuleService.ensureSubModule(module._id, {
        key: subModuleDef.key,
        name: subModuleDef.name,
        order: subModuleDef.order,
      });
      for (const operationDef of subModuleDef.operations) {
        const operation = await operationService.ensureOperation(module._id, subModule._id, {
          key: operationDef.key,
          name: operationDef.name,
          order: operationDef.order,
        });
        const key = buildPermissionKey(moduleDef.key, operationDef.key, subModuleDef.key);
        await permissionService.ensurePermission({
          key,
          name: `${operationDef.name} ${subModuleDef.name}`,
          description: `${moduleDef.name} / ${subModuleDef.name}`,
          moduleId: module._id,
          operationId: operation._id,
        });
        allKeys.push(key);
      }
    }
  }
  return allKeys;
}

export async function createRole(
  slug: string,
  permissionKeys: string[] = [],
  options?: { name?: string; isSystem?: boolean }
): Promise<Types.ObjectId> {
  const role = await roleRepository.create({
    name: options?.name ?? slug,
    slug,
    isSystem: options?.isSystem ?? false,
  });
  if (permissionKeys.length > 0) {
    await rolePermissionRepository.insertMany(
      permissionKeys.map((key) => ({ roleId: role._id, permissionKey: key }))
    );
  }
  return role._id;
}

export async function createUser(
  email: string,
  roleIds: Types.ObjectId[],
  options?: { status?: "active" | "suspended" }
): Promise<Types.ObjectId> {
  const user = await userRepository.create({
    name: "Test User",
    email,
    passwordHash: bcrypt.hashSync(TEST_PASSWORD, TEST_BCRYPT_COST),
    roleIds,
    status: options?.status ?? "active",
  });
  return user._id;
}

export async function login(email: string): Promise<string> {
  const res = await request(app)
    .post("/api/v1/auth/login")
    .send({ email, password: TEST_PASSWORD });
  if (res.status !== 200) {
    throw new Error(`Login failed for ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.data.accessToken;
}

export interface AdminSession {
  token: string;
  roleId: Types.ObjectId;
  userId: Types.ObjectId;
}

export async function seedAdmin(): Promise<AdminSession> {
  const allKeys = await seedRbacHierarchy();
  const roleId = await createRole("test-admin", allKeys, { isSystem: true });
  const userId = await createUser("admin@example.com", [roleId]);
  const token = await login("admin@example.com");
  return { token, roleId, userId };
}

export const SUPER_ADMIN = SUPER_ADMIN_ROLE_SLUG;