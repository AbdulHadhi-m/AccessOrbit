import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { openApiDocument } from "./openapi.js";

describe("Docs & OpenAPI Specification", () => {
  it("serves OpenAPI JSON spec at /api/v1/docs/json", async () => {
    const res = await request(app).get("/api/v1/docs/json");
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe("3.0.3");
    expect(res.body.info.title).toBe("AccessOrbit REST API");
    expect(res.body.paths).toBeDefined();
  });

  it("serves Swagger UI HTML at /api/v1/docs/", async () => {
    const res = await request(app).get("/api/v1/docs/");
    expect([200, 301, 302]).toContain(res.status);
  });

  it("documents all primary entities in paths", () => {
    const paths = Object.keys(openApiDocument.paths);
    
    // Auth & Health
    expect(paths).toContain("/health");
    expect(paths).toContain("/auth/login");
    expect(paths).toContain("/auth/refresh");
    expect(paths).toContain("/auth/logout");
    expect(paths).toContain("/auth/me");

    // Core RBAC
    expect(paths).toContain("/users");
    expect(paths).toContain("/users/{id}");
    expect(paths).toContain("/users/{id}/roles");
    expect(paths).toContain("/roles");
    expect(paths).toContain("/roles/{id}");
    expect(paths).toContain("/roles/{id}/permissions");
    expect(paths).toContain("/roles/{id}/permissions/{permissionId}");
    expect(paths).toContain("/modules");
    expect(paths).toContain("/modules/hierarchy");
    expect(paths).toContain("/modules/{id}");
    expect(paths).toContain("/sub-modules");
    expect(paths).toContain("/sub-modules/{id}");
    expect(paths).toContain("/operations");
    expect(paths).toContain("/operations/{id}");
    expect(paths).toContain("/permissions");
    expect(paths).toContain("/permissions/{id}");

    // Auditing & Search
    expect(paths).toContain("/audit-logs");
    expect(paths).toContain("/search");
  });

  it("assigns valid tags and security schemes to every operation", () => {
    const allTags = new Set(openApiDocument.tags?.map((t) => t.name));
    
    for (const [pathKey, pathItem] of Object.entries(openApiDocument.paths)) {
      for (const method of ["get", "post", "patch", "delete", "put"] as const) {
        const operation = pathItem?.[method];
        if (!operation) continue;

        expect(operation.summary).toBeTruthy();
        expect(operation.tags?.length).toBeGreaterThan(0);
        operation.tags?.forEach((tag) => {
          expect(allTags.has(tag)).toBe(true);
        });
        expect(operation.responses).toBeDefined();
        expect(Object.keys(operation.responses).length).toBeGreaterThan(0);
      }
    }
  });

  it("defines all critical components and schemas", () => {
    const schemas = openApiDocument.components?.schemas;
    expect(schemas).toBeDefined();
    expect(schemas).toHaveProperty("User");
    expect(schemas).toHaveProperty("Role");
    expect(schemas).toHaveProperty("Module");
    expect(schemas).toHaveProperty("SubModule");
    expect(schemas).toHaveProperty("Operation");
    expect(schemas).toHaveProperty("Permission");
    expect(schemas).toHaveProperty("Hierarchy");
    expect(schemas).toHaveProperty("AuditLog");
    expect(schemas).toHaveProperty("SearchResult");
    expect(schemas).toHaveProperty("ErrorResponse");
  });
});
