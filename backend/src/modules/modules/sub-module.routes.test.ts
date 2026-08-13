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
import { moduleService } from "./module.service.js";
import { operationService } from "./operation.service.js";
import { subModuleRepository } from "./sub-module.repository.js";
import { subModuleService } from "./sub-module.service.js";

describe("sub-modules admin API", () => {
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

  describe("create sub-module", () => {
    it("creates a sub-module for a valid module", async () => {
      const module = await moduleService.ensureModule({ key: "payroll", name: "Payroll" });
      const res = await request(app)
        .post("/api/v1/sub-modules")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ moduleId: module._id.toString(), key: "runs", name: "Payroll Runs" });

      expect(res.status).toBe(201);
      expect(res.body.data.subModule.moduleId).toBe(module._id.toString());
      expect(res.body.data.subModule.key).toBe("runs");
    });

    it("rejects a sub-module for a non-existent module with 422", async () => {
      const res = await request(app)
        .post("/api/v1/sub-modules")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          moduleId: new Types.ObjectId().toString(),
          key: "runs",
          name: "Payroll Runs",
        });
      expect(res.status).toBe(422);
      expect(res.body.error.details[0].field).toBe("moduleId");
    });

    it("rejects duplicate key within the same module with 409", async () => {
      const module = await moduleService.ensureModule({ key: "payroll", name: "Payroll" });
      await subModuleService.ensureSubModule(module._id, { key: "runs", name: "Runs" });
      const res = await request(app)
        .post("/api/v1/sub-modules")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ moduleId: module._id.toString(), key: "runs", name: "Runs Again" });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("CONFLICT");
    });

    it("allows the same key in different modules", async () => {
      const a = await moduleService.ensureModule({ key: "payroll", name: "Payroll" });
      const b = await moduleService.ensureModule({ key: "recruiting", name: "Recruiting" });
      const res = await request(app)
        .post("/api/v1/sub-modules")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ moduleId: b._id.toString(), key: "runs", name: "Runs" });
      expect(res.status).toBe(201);
      expect(await subModuleRepository.findByModuleAndKey(a._id, "runs")).toBeDefined();
    });
  });

  describe("list sub-modules", () => {
    it("filters by module", async () => {
      const a = await moduleService.ensureModule({ key: "payroll", name: "Payroll" });
      const b = await moduleService.ensureModule({ key: "recruiting", name: "Recruiting" });
      await subModuleService.ensureSubModule(a._id, { key: "runs", name: "Runs" });
      await subModuleService.ensureSubModule(b._id, { key: "candidates", name: "Candidates" });

      const res = await request(app)
        .get(`/api/v1/sub-modules?moduleId=${a._id}`)
        .set("Authorization", `Bearer ${admin.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.items[0].key).toBe("runs");
    });
  });

  describe("update sub-module", () => {
    it("updates name and active state", async () => {
      const module = await moduleService.ensureModule({ key: "payroll", name: "Payroll" });
      const subModule = await subModuleService.ensureSubModule(module._id, {
        key: "runs",
        name: "Runs",
      });
      const res = await request(app)
        .patch(`/api/v1/sub-modules/${subModule._id}`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ name: "Run Batches", active: false });

      expect(res.status).toBe(200);
      expect(res.body.data.subModule.name).toBe("Run Batches");
      expect(res.body.data.subModule.active).toBe(false);
    });
  });

  describe("delete sub-module", () => {
    it("rejects deleting a sub-module with operations with 409", async () => {
      const module = await moduleService.ensureModule({ key: "payroll", name: "Payroll" });
      const subModule = await subModuleService.ensureSubModule(module._id, {
        key: "runs",
        name: "Runs",
      });
      await operationService.ensureOperation(module._id, subModule._id, {
        key: "view",
        name: "View",
      });

      const res = await request(app)
        .delete(`/api/v1/sub-modules/${subModule._id}`)
        .set("Authorization", `Bearer ${admin.token}`);
      expect(res.status).toBe(409);
    });

    it("deletes an unreferenced sub-module", async () => {
      const module = await moduleService.ensureModule({ key: "payroll", name: "Payroll" });
      const subModule = await subModuleService.ensureSubModule(module._id, {
        key: "runs",
        name: "Runs",
      });
      const res = await request(app)
        .delete(`/api/v1/sub-modules/${subModule._id}`)
        .set("Authorization", `Bearer ${admin.token}`);
      expect(res.status).toBe(200);
    });
  });
});