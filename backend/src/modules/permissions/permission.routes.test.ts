import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { Types } from "mongoose";
import { app } from "../../app.js";
import {
  clearTestDb,
  connectTestDb,
  disconnectTestDb,
} from "../../database/test-db.js";
import { createRole, seedAdmin } from "../../database/test-helpers.js";
import { moduleService } from "../modules/module.service.js";
import { operationService } from "../modules/operation.service.js";
import { permissionRepository } from "./permission.repository.js";

describe("permissions admin API", () => {
  let admin: { token: string; roleId: Types.ObjectId; userId: Types.ObjectId };

  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    admin = await seedAdmin();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe("create permission", () => {
    it("creates a permission tied to a module and its operation", async () => {
      const module = await moduleService.ensureModule({ key: "payroll", name: "Payroll" });
      const operation = await operationService.ensureOperation(module._id, null, {
        key: "view",
        name: "View",
      });
      const res = await request(app)
        .post("/api/v1/permissions")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          key: "payroll.view",
          name: "View Payroll",
          moduleId: module._id.toString(),
          operationId: operation._id.toString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.data.permission.key).toBe("payroll.view");
      expect(res.body.data.permission.active).toBe(true);
    });

    it("rejects duplicate keys with 409", async () => {
      const module = await moduleService.ensureModule({ key: "payroll", name: "Payroll" });
      const operation = await operationService.ensureOperation(module._id, null, {
        key: "view",
        name: "View",
      });
      await request(app)
        .post("/api/v1/permissions")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          key: "payroll.view",
          name: "View Payroll",
          moduleId: module._id.toString(),
          operationId: operation._id.toString(),
        });

      const res = await request(app)
        .post("/api/v1/permissions")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          key: "payroll.view",
          name: "View Payroll Again",
          moduleId: module._id.toString(),
          operationId: operation._id.toString(),
        });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("CONFLICT");
    });

    it("rejects an operation that belongs to a different module with 422", async () => {
      const a = await moduleService.ensureModule({ key: "payroll", name: "Payroll" });
      const b = await moduleService.ensureModule({ key: "recruiting", name: "Recruiting" });
      const operationOfB = await operationService.ensureOperation(b._id, null, {
        key: "view",
        name: "View",
      });
      const res = await request(app)
        .post("/api/v1/permissions")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          key: "payroll.view",
          name: "View Payroll",
          moduleId: a._id.toString(),
          operationId: operationOfB._id.toString(),
        });
      expect(res.status).toBe(422);
      expect(res.body.error.details[0].field).toBe("moduleId");
    });
  });

  describe("list and update", () => {
    it("lists permissions with pagination and filters by module", async () => {
      const module = await moduleService.ensureModule({ key: "payroll", name: "Payroll" });
      const operation = await operationService.ensureOperation(module._id, null, {
        key: "view",
        name: "View",
      });
      await permissionRepository.create({
        key: "payroll.view",
        name: "View Payroll",
        moduleId: module._id,
        operationId: operation._id,
      });

      const res = await request(app)
        .get(`/api/v1/permissions?moduleId=${module._id}&search=view`)
        .set("Authorization", `Bearer ${admin.token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.items[0].key).toBe("payroll.view");
    });

    it("disables a permission via PATCH", async () => {
      const module = await moduleService.ensureModule({ key: "payroll", name: "Payroll" });
      const operation = await operationService.ensureOperation(module._id, null, {
        key: "view",
        name: "View",
      });
      const permission = await permissionRepository.create({
        key: "payroll.view",
        name: "View Payroll",
        moduleId: module._id,
        operationId: operation._id,
      });

      const res = await request(app)
        .patch(`/api/v1/permissions/${permission._id}`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ active: false });
      expect(res.status).toBe(200);
      expect(res.body.data.permission.active).toBe(false);

      const updated = await permissionRepository.findById(permission._id);
      expect(updated?.active).toBe(false);
    });
  });

  describe("delete permission", () => {
    it("rejects deleting a permission assigned to roles with 409", async () => {
      const module = await moduleService.ensureModule({ key: "payroll", name: "Payroll" });
      const operation = await operationService.ensureOperation(module._id, null, {
        key: "view",
        name: "View",
      });
      const permission = await permissionRepository.create({
        key: "payroll.view",
        name: "View Payroll",
        moduleId: module._id,
        operationId: operation._id,
      });
      await createRole("viewer", ["payroll.view"]);

      const res = await request(app)
        .delete(`/api/v1/permissions/${permission._id}`)
        .set("Authorization", `Bearer ${admin.token}`);
      expect(res.status).toBe(409);
      expect(res.body.error.message).toContain("disable");
    });

    it("deletes an unassigned permission", async () => {
      const module = await moduleService.ensureModule({ key: "payroll", name: "Payroll" });
      const operation = await operationService.ensureOperation(module._id, null, {
        key: "view",
        name: "View",
      });
      const permission = await permissionRepository.create({
        key: "payroll.view",
        name: "View Payroll",
        moduleId: module._id,
        operationId: operation._id,
      });

      const res = await request(app)
        .delete(`/api/v1/permissions/${permission._id}`)
        .set("Authorization", `Bearer ${admin.token}`);
      expect(res.status).toBe(200);
      expect(await permissionRepository.findById(permission._id)).toBeNull();
    });
  });

  describe("authorization", () => {
    it("returns 401 without a token", async () => {
      const res = await request(app).get("/api/v1/permissions");
      expect(res.status).toBe(401);
    });
  });
});