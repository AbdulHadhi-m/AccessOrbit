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
import { subModuleService } from "./sub-module.service.js";

describe("modules admin API", () => {
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

  describe("create module", () => {
    it("creates a module with display metadata", async () => {
      const res = await request(app)
        .post("/api/v1/modules")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          key: "payroll",
          name: "Payroll",
          description: "Payroll processing",
          order: 5,
          icon: "banknote",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.module.key).toBe("payroll");
      expect(res.body.data.module.order).toBe(5);
      expect(res.body.data.module.active).toBe(true);
    });

    it("rejects duplicate keys with 409", async () => {
      await moduleService.ensureModule({ key: "payroll", name: "Payroll" });
      const res = await request(app)
        .post("/api/v1/modules")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ key: "payroll", name: "Payroll Duplicate" });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("CONFLICT");
    });

    it("rejects invalid keys and empty names with 422", async () => {
      const badKey = await request(app)
        .post("/api/v1/modules")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ key: "Not Valid", name: "Bad" });
      expect(badKey.status).toBe(422);

      const noName = await request(app)
        .post("/api/v1/modules")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ key: "valid-key", name: "" });
      expect(noName.status).toBe(422);
    });
  });

  describe("list and get modules", () => {
    it("lists modules with pagination and search", async () => {
      await moduleService.ensureModule({ key: "payroll", name: "Payroll" });
      await moduleService.ensureModule({ key: "recruiting", name: "Recruiting" });

      const all = await request(app)
        .get("/api/v1/modules")
        .set("Authorization", `Bearer ${admin.token}`);
      expect(all.status).toBe(200);
      expect(all.body.data.total).toBeGreaterThanOrEqual(2);
      const keys = all.body.data.items.map((m: { key: string }) => m.key);
      expect(keys).toContain("payroll");
      expect(keys).toContain("recruiting");

      const search = await request(app)
        .get("/api/v1/modules?search=pay")
        .set("Authorization", `Bearer ${admin.token}`);
      expect(search.body.data.total).toBe(1);
      expect(search.body.data.items[0].key).toBe("payroll");
    });

    it("returns 404 for a missing module", async () => {
      const res = await request(app)
        .get(`/api/v1/modules/${new Types.ObjectId()}`)
        .set("Authorization", `Bearer ${admin.token}`);
      expect(res.status).toBe(404);
    });
  });

  describe("update module", () => {
    it("updates name and display metadata but never the key", async () => {
      const module = await moduleService.ensureModule({ key: "payroll", name: "Payroll" });
      const res = await request(app)
        .patch(`/api/v1/modules/${module._id}`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ name: "Payroll Plus", order: 9, active: false });

      expect(res.status).toBe(200);
      expect(res.body.data.module.name).toBe("Payroll Plus");
      expect(res.body.data.module.key).toBe("payroll");
      expect(res.body.data.module.active).toBe(false);

      const keyChange = await request(app)
        .patch(`/api/v1/modules/${module._id}`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ key: "renamed" });
      expect(keyChange.status).toBe(422);
    });
  });

  describe("delete module", () => {
    it("deletes an unreferenced module", async () => {
      const module = await moduleService.ensureModule({ key: "payroll", name: "Payroll" });
      const res = await request(app)
        .delete(`/api/v1/modules/${module._id}`)
        .set("Authorization", `Bearer ${admin.token}`);
      expect(res.status).toBe(200);
    });

    it("rejects deleting a module with sub-modules with 409", async () => {
      const module = await moduleService.ensureModule({ key: "payroll", name: "Payroll" });
      await subModuleService.ensureSubModule(module._id, { key: "runs", name: "Runs" });
      const res = await request(app)
        .delete(`/api/v1/modules/${module._id}`)
        .set("Authorization", `Bearer ${admin.token}`);
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("CONFLICT");
    });
  });

  describe("hierarchy", () => {
    it("returns the full module → sub-module → operation → permission tree", async () => {
      const module = await moduleService.ensureModule({ key: "payroll", name: "Payroll" });
      await subModuleService.ensureSubModule(module._id, {
        key: "runs",
        name: "Runs",
      });
      await moduleService.createModule({ key: "recruiting", name: "Recruiting" });

      const res = await request(app)
        .get("/api/v1/modules/hierarchy")
        .set("Authorization", `Bearer ${admin.token}`);

      expect(res.status).toBe(200);
      const rbac = res.body.data.modules.find((m: { key: string }) => m.key === "rbac");
      expect(rbac).toBeDefined();
      expect(rbac.subModules.length).toBeGreaterThan(0);
      const rolesSubModule = rbac.subModules.find(
        (sm: { key: string }) => sm.key === "roles"
      );
      expect(rolesSubModule).toBeDefined();
      expect(rolesSubModule.operations.length).toBeGreaterThan(0);
      const viewOperation = rolesSubModule.operations.find(
        (op: { key: string }) => op.key === "view"
      );
      expect(viewOperation).toBeDefined();
      expect(viewOperation.permissions.length).toBeGreaterThan(0);
      expect(viewOperation.permissions[0].key).toBe("rbac.roles.view");

      const payroll = res.body.data.modules.find(
        (m: { key: string }) => m.key === "payroll"
      );
      expect(payroll).toBeDefined();
      expect(payroll.subModules).toHaveLength(1);
      expect(payroll.subModules[0].key).toBe("runs");
    });
  });

  describe("authorization", () => {
    it("returns 401 without a token", async () => {
      const res = await request(app).get("/api/v1/modules");
      expect(res.status).toBe(401);
    });
  });
});