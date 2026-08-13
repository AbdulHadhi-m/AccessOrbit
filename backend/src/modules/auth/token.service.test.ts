import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Types } from "mongoose";
import { clearTestDb, connectTestDb, disconnectTestDb } from "../../database/test-db.js";
import { RefreshTokenModel } from "../../database/models/index.js";
import { tokenService } from "./token.service.js";
import { UnauthorizedError } from "../../shared/errors/index.js";

describe("tokenService", () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it("signs and verifies an access token", () => {
    const token = tokenService.signAccessToken("507f1f77bcf86cd799439011");
    const payload = tokenService.verifyAccessToken(token);

    expect(payload.sub).toBe("507f1f77bcf86cd799439011");
    expect(payload.type).toBe("access");
    expect(payload.jti).toBeTruthy();
  });

  it("rejects a token signed with the wrong secret", async () => {
    const { default: jwt } = await import("jsonwebtoken");
    const token = jwt.sign(
      { sub: "507f1f77bcf86cd799439011", type: "access", jti: "x" },
      "a-different-secret-that-is-at-least-32-characters-long!!"
    );
    expect(() => tokenService.verifyAccessToken(token)).toThrow(UnauthorizedError);
  });

  it("stores only a hash of the refresh token", async () => {
    const { refreshToken } = await tokenService.createRefreshSession(
      new Types.ObjectId()
    );

    const rows = await RefreshTokenModel.find().lean().exec();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.tokenHash).not.toBe(refreshToken);
    expect(rows[0]?.tokenHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("rotates a refresh token within the same family", async () => {
    const userId = new Types.ObjectId();
    const { refreshToken, familyId } = await tokenService.createRefreshSession(userId);

    const rotated = await tokenService.rotateRefreshToken(refreshToken);
    expect(rotated.refreshToken).not.toBe(refreshToken);
    expect(rotated.userId).toBe(userId.toString());

    const rows = await RefreshTokenModel.find().lean().exec();
    expect(rows).toHaveLength(2);
    const oldRow = rows.find((row) => row.replacedByTokenHash);
    const newRow = rows.find((row) => !row.replacedByTokenHash);
    expect(oldRow?.familyId).toBe(familyId);
    expect(newRow?.familyId).toBe(familyId);
    expect(oldRow?.revokedAt).toBeTruthy();
  });

  it("revokes the whole family when a rotated token is reused", async () => {
    const userId = new Types.ObjectId();
    const { refreshToken } = await tokenService.createRefreshSession(userId);
    const rotated = await tokenService.rotateRefreshToken(refreshToken);

    await expect(tokenService.rotateRefreshToken(refreshToken)).rejects.toThrow(
      UnauthorizedError
    );

    const rows = await RefreshTokenModel.find().lean().exec();
    expect(rows.every((row) => row.revokedAt)).toBe(true);

    await expect(tokenService.rotateRefreshToken(rotated.refreshToken)).rejects.toThrow(
      UnauthorizedError
    );
  });

  it("revokes a token family on logout", async () => {
    const userId = new Types.ObjectId();
    const { refreshToken } = await tokenService.createRefreshSession(userId);

    expect(await tokenService.revokeRefreshToken(refreshToken)).toBe(true);
    await expect(tokenService.rotateRefreshToken(refreshToken)).rejects.toThrow(
      UnauthorizedError
    );
  });

  it("rejects an expired refresh token", async () => {
    const userId = new Types.ObjectId();
    const { refreshToken } = await tokenService.createRefreshSession(userId);
    await RefreshTokenModel.updateOne(
      { userId },
      { $set: { expiresAt: new Date(Date.now() - 1000) } }
    ).exec();

    await expect(tokenService.rotateRefreshToken(refreshToken)).rejects.toThrow(
      UnauthorizedError
    );
  });
});