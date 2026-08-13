import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { Types } from "mongoose";
import { app } from "../../app.js";
import {
  clearTestDb,
  connectTestDb,
  disconnectTestDb,
} from "../../database/test-db.js";
import { seedAdmin } from "../../database/test-helpers.js";
import { permissionService } from "../permissions/permission.service.js";
import { moduleService } from "./module.service.js";
import { operationService } from "./operation.service.js";
import { subModuleService } from "./sub-module.service.js";

describe("operations admin API", () => {
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

  describe("create operation", () => {
    it("creates an operation in a valid hierarchy", async () => {
      const module = await moduleService.ensureModule({ key: "payroll", name: "Payroll" });
      const subModule = await subModuleService.ensureSubModule(module._id, {
        key: "runs",
        name: "Runs",
      });
      const res = await request(app)
        .post("/api/v1/operations")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          moduleId: module._id.toString(),
          subModuleId: subModule._id.toString(),
          key: "approve",
          name: "Approve",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.operation.key).toBe("approve");
      expect(res.body.data.operation.subModuleId).toBe(subModule._id.toString());
    });

    it("rejects a non-existent module with 422", async () => {
      const res = await request(app)
        .post("/api/v1/operations")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          moduleId: new Types.ObjectId().toString(),
          key: "view",
          name: "View",
        });
      expect(res.status).toBe(422);
      expect(res.body.error.details[0].field).toBe("moduleId");
    });

    it("rejects a sub-module that does not belong to the module with 422", async () => {
      const a = await moduleService.ensureModule({ key: "payroll", name: "Payroll" });
      const b = await moduleService.ensureModule({ key: "recruiting", name: "Recruiting" });
      const subModuleOfB = await subModuleService.ensureSubModule(b._id, {
        key: "candidates",
        name: "Candidates",
      });
      const res = await request(app)
        .post("/api/v1/operations")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          moduleId: a._id.toString(),
          subModuleId: subModuleOfB._id.toString(),
          key: "view",
          name: "View",
        });
      expect(res.status).toBe(422);
      expect(res.body.error.details[0].field).toBe("subModuleId");
    });

    it("rejects a duplicate key in the same module/sub-module with 409", async () => {
      const module = await moduleService.ensureModule({ key: "payroll", name: "Payroll" });
      const subModule = await subModuleService.ensureSubModule(module._id, {
        key: "runs",
        name: "Runs",
      });
      await request(app)
        .post("/api/v1/operations")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          moduleId: module._id.toString(),
          subModuleId: subModule._id.toString(),
          key: "view",
          name: "View",
        });

      const res = await request(app)
        .post("/api/v1/operations")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          moduleId: module._id.toString(),
          subModuleId: subModule._id.toString(),
          key: "view",
          name: "View Duplicate",
        });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("CONFLICT");
    });
  });

  describe("list operations", () => {
    it("filters by module and sub-module", async () => {
      const module = await moduleService.ensureModule({ key: "payroll", name: "Payroll" });
      const subModule = await subModuleService.ensureSubModule(module._id, {
        key: "runs",
        name: "Runs",
      });
      await operationService.ensureOperation(module._id, subModule._id, {
        key: "view",
        name: "View",
      });
      await operationService.ensureOperation(module._id, subModule._id, {
        key: "approve",
        name: "Approve",
      });

      const res = await request(app)
        .get(`/api/v1/operations?moduleId=${module._id}&subModuleId=${subModule._id}`)
        .set("Authorization", `Bearer ${admin.token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(2);
    });
  });

  describe("update operation", () => {
    it("updates name and active state", async () => {
      const module = await moduleService.ensureModule({ key: "payroll", name: "Payroll" });
      const operation = await operationService.ensureOperation(module._id, null, {
        key: "view",
        name: "View",
      });
      const res = await request(app)
        .patch(`/api/v1/operations/${operation._id}`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ name: "Browse", active: false });
      expect(res.status).toBe(200);
      expect(res.body.data.operation.name).toBe("Browse");
      expect(res.body.data.operation.active).toBe(false);
    });
  });

  describe("delete operation", () => {
    it("rejects deleting an operation referenced by permissions with 409", async () => {
      const module = await moduleService.ensureModule({ key: "payroll", name: "Payroll" });
      const operation = await operationService.ensureOperation(module._id, null, {
        key: "view",
        name: "View",
      });
      await permissionService.createPermission({
        key: "payroll.view",
        name: "View Payroll",
        moduleId: module._id,
        operationId: operation._id,
      });

      const res = await request(app)
        .delete(`/api/v1/operations/${operation._id}`)
        .set("Authorization", `Bearer ${admin.token}`);
      expect(res.status).toBe(409);
    });
  });
});