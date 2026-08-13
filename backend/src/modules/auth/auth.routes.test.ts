import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createHash } from "node:crypto";
import { app } from "../../app.js";
import { clearTestDb, connectTestDb, disconnectTestDb } from "../../database/test-db.js";
import { RefreshTokenModel } from "../../database/models/index.js";
import { env } from "../../config/env.js";
import { userRepository } from "../users/user.repository.js";
import { roleRepository } from "../roles/role.repository.js";
import { REFRESH_COOKIE_NAME } from "./token.service.js";

const TEST_PASSWORD = "TestPass123!";

async function createUser(overrides: { email?: string; status?: "active" | "suspended" } = {}) {
  const role = await roleRepository.create({
    name: "Employee",
    slug: "employee",
    isSystem: true,
  });
  return userRepository.create({
    name: "Test User",
    email: overrides.email ?? "test@example.com",
    passwordHash: bcrypt.hashSync(TEST_PASSWORD, 4),
    roleIds: [role._id],
    status: overrides.status ?? "active",
  });
}

function extractRefreshCookie(res: request.Response): string | undefined {
  const setCookie = res.headers["set-cookie"] as unknown as string[] | undefined;
  const cookie = setCookie?.find((c) => c.startsWith(`${REFRESH_COOKIE_NAME}=`));
  if (!cookie) return undefined;
  const match = /^refresh_token=([^;]+)/.exec(cookie);
  return match ? decodeURIComponent(match[1] ?? "") : undefined;
}

describe("auth HTTP flows", () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe("POST /api/v1/auth/login", () => {
    it("logs in with valid credentials and sets an httpOnly refresh cookie", async () => {
      await createUser();

      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "test@example.com", password: TEST_PASSWORD });

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe("test@example.com");
      expect(res.body.data.user).not.toHaveProperty("passwordHash");
      expect(typeof res.body.data.accessToken).toBe("string");
      expect(res.body.data.accessToken).not.toBe("");
      expect(res.headers["set-cookie"]).toBeDefined();
      const cookieHeader = (res.headers["set-cookie"] as unknown as string[])[0] ?? "";
      expect(cookieHeader).toContain("HttpOnly");
      expect(cookieHeader).toContain("Path=/api/v1/auth");
      expect(cookieHeader.toLowerCase()).toContain("samesite=lax");
    });

    it("rejects an invalid password with a generic credential error", async () => {
      await createUser();

      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "test@example.com", password: "WrongPass123!" });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("AUTH_INVALID_CREDENTIALS");
    });

    it("rejects a non-existent user with the same generic error", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "ghost@example.com", password: TEST_PASSWORD });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("AUTH_INVALID_CREDENTIALS");
    });

    it("rejects a disabled user", async () => {
      await createUser({ status: "suspended" });

      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "test@example.com", password: TEST_PASSWORD });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("AUTH_USER_DISABLED");
    });

    it("rejects missing or malformed input", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "not-an-email", password: "" });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("GET /api/v1/auth/me", () => {
    it("returns the current user for an authenticated request", async () => {
      const user = await createUser();
      const loginRes = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "test@example.com", password: TEST_PASSWORD });

      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${loginRes.body.data.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.id).toBe(user._id.toString());
      expect(res.body.data.user.email).toBe("test@example.com");
      expect(res.body.data.user.name).toBe("Test User");
      expect(res.body.data.user.status).toBe("active");
      expect(res.body.data.user.roles[0]?.slug).toBe("employee");
      expect(res.body.data.user).not.toHaveProperty("passwordHash");
      expect(res.body.data.user).not.toHaveProperty("roleIds");
    });

    it("rejects a request without a token", async () => {
      const res = await request(app).get("/api/v1/auth/me");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("AUTH_UNAUTHORIZED");
    });

    it("rejects a garbage token", async () => {
      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", "Bearer not.a.jwt");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("AUTH_TOKEN_INVALID");
    });

    it("rejects an expired access token", async () => {
      const user = await createUser();
      const token = jwt.sign(
        { sub: user._id.toString(), type: "access", jti: "test-jti" },
        env.JWT_ACCESS_SECRET,
        { expiresIn: "-10s" }
      );

      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("AUTH_TOKEN_EXPIRED");
    });

    it("blocks a user disabled after login", async () => {
      const user = await createUser();
      const loginRes = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "test@example.com", password: TEST_PASSWORD });
      await userRepository.setStatus(user._id, "suspended");

      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${loginRes.body.data.accessToken}`);
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("AUTH_USER_DISABLED");
    });
  });

  describe("POST /api/v1/auth/refresh", () => {
    it("rotates the refresh token and returns a new pair", async () => {
      await createUser();
      const loginRes = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "test@example.com", password: TEST_PASSWORD });

      const agent = request.agent(app);
      await agent.post("/api/v1/auth/login").send({
        email: "test@example.com",
        password: TEST_PASSWORD,
      });

      const refreshRes = await agent.post("/api/v1/auth/refresh");
      expect(refreshRes.status).toBe(200);
      expect(typeof refreshRes.body.data.accessToken).toBe("string");

      const newCookie = extractRefreshCookie(refreshRes);
      const oldCookie = extractRefreshCookie(loginRes);
      expect(newCookie).toBeDefined();
      expect(newCookie).not.toBe(oldCookie);
    });

    it("rejects a request without a refresh cookie", async () => {
      const res = await request(app).post("/api/v1/auth/refresh");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("AUTH_REFRESH_INVALID");
    });
    it("detects reuse of an already-rotated refresh token and revokes the family", async () => {
      await createUser();
      const agent = request.agent(app);
      const loginRes = await agent.post("/api/v1/auth/login").send({
        email: "test@example.com",
        password: TEST_PASSWORD,
      });
      const originalToken = extractRefreshCookie(loginRes);

      const firstRefresh = await agent.post("/api/v1/auth/refresh");
      expect(firstRefresh.status).toBe(200);

      const reused = await request(app)
        .post("/api/v1/auth/refresh")
        .set("Cookie", `${REFRESH_COOKIE_NAME}=${originalToken}`);
      expect(reused.status).toBe(401);
      expect(reused.body.error.code).toBe("AUTH_REFRESH_REUSE");

      const afterReuse = await agent.post("/api/v1/auth/refresh");
      expect(afterReuse.status).toBe(401);
      expect(afterReuse.body.error.code).toBe("AUTH_REFRESH_REUSE");
    });

    it("rejects an expired refresh token", async () => {
      await createUser();
      const agent = request.agent(app);
      const loginRes = await agent.post("/api/v1/auth/login").send({
        email: "test@example.com",
        password: TEST_PASSWORD,
      });
      const token = extractRefreshCookie(loginRes);
      const tokenHash = createHash("sha256").update(token ?? "").digest("hex");
      await RefreshTokenModel.updateOne(
        { tokenHash },
        { $set: { expiresAt: new Date(Date.now() - 1000) } }
      ).exec();

      const res = await agent.post("/api/v1/auth/refresh");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("AUTH_REFRESH_INVALID");
    });

    it("rejects an unknown refresh token", async () => {
      await createUser();
      const res = await request(app)
        .post("/api/v1/auth/refresh")
        .set("Cookie", `${REFRESH_COOKIE_NAME}=${"f".repeat(96)}`);
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("AUTH_REFRESH_INVALID");
    });
  });

  describe("POST /api/v1/auth/logout", () => {
    it("logs out and revokes the refresh session", async () => {
      await createUser();
      const agent = request.agent(app);
      const loginRes = await agent.post("/api/v1/auth/login").send({
        email: "test@example.com",
        password: TEST_PASSWORD,
      });

      const logoutRes = await agent
        .post("/api/v1/auth/logout")
        .set("Authorization", `Bearer ${loginRes.body.data.accessToken}`);
      expect(logoutRes.status).toBe(200);

      const refreshed = await agent.post("/api/v1/auth/refresh");
      expect(refreshed.status).toBe(401);
      expect(refreshed.body.error.code).toBe("AUTH_REFRESH_INVALID");
    });

    it("requires an access token", async () => {
      const res = await request(app).post("/api/v1/auth/logout");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("AUTH_UNAUTHORIZED");
    });

    it("clears the refresh cookie on logout", async () => {
      await createUser();
      const agent = request.agent(app);
      const loginRes = await agent.post("/api/v1/auth/login").send({
        email: "test@example.com",
        password: TEST_PASSWORD,
      });

      const logoutRes = await agent
        .post("/api/v1/auth/logout")
        .set("Authorization", `Bearer ${loginRes.body.data.accessToken}`);
      const cookies = logoutRes.headers["set-cookie"] as unknown as string[] | undefined;
      const cleared = cookies?.find((c) => c.startsWith(`${REFRESH_COOKIE_NAME}=`));
      expect(cleared).toContain("Max-Age=0");
    });
  });
});