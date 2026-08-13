import { createHash, randomBytes, randomUUID } from "node:crypto";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { Types } from "mongoose";
import { env } from "../../config/env.js";
import { RefreshTokenModel } from "../../database/models/index.js";
import { UnauthorizedError } from "../../shared/errors/index.js";

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
export const REFRESH_COOKIE_NAME = "refresh_token";

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export interface AccessTokenPayload extends JwtPayload {
  sub: string;
  type: "access";
  jti: string;
}

function verifyAccessToken(token: string): AccessTokenPayload {
  let payload: string | JwtPayload;
  try {
    payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError("Access token has expired", "AUTH_TOKEN_EXPIRED");
    }
    throw new UnauthorizedError("Access token is invalid", "AUTH_TOKEN_INVALID");
  }
  if (typeof payload === "string" || payload.type !== "access" || !payload.sub) {
    throw new UnauthorizedError("Access token is invalid", "AUTH_TOKEN_INVALID");
  }
  return payload as AccessTokenPayload;
}

function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId, type: "access", jti: randomUUID() }, env.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  });
}

async function createRefreshSession(
  userId: string | Types.ObjectId
): Promise<{ refreshToken: string; familyId: string }> {
  const familyId = randomUUID();
  return createRefreshTokenInFamily(userId, familyId);
}

async function createRefreshTokenInFamily(
  userId: string | Types.ObjectId,
  familyId: string
): Promise<{ refreshToken: string; familyId: string }> {
  const refreshToken = randomBytes(48).toString("hex");
  await RefreshTokenModel.create({
    tokenHash: hashToken(refreshToken),
    userId,
    familyId,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
  });
  return { refreshToken, familyId };
}

async function revokeFamily(familyId: string): Promise<void> {
  await RefreshTokenModel.updateMany(
    { familyId, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  ).exec();
}

async function rotateRefreshToken(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string; userId: string }> {
  const tokenHash = hashToken(refreshToken);
  const session = await RefreshTokenModel.findOne({ tokenHash }).exec();

  if (!session || session.expiresAt.getTime() <= Date.now()) {
    throw new UnauthorizedError("Refresh token is invalid", "AUTH_REFRESH_INVALID");
  }

  if (session.revokedAt) {
    await revokeFamily(session.familyId);
    throw new UnauthorizedError("Refresh token has been reused", "AUTH_REFRESH_REUSE");
  }

  const { refreshToken: nextRefreshToken } = await createRefreshTokenInFamily(
    session.userId,
    session.familyId
  );

  session.revokedAt = new Date();
  session.replacedByTokenHash = hashToken(nextRefreshToken);
  await session.save();

  return {
    accessToken: signAccessToken(session.userId.toString()),
    refreshToken: nextRefreshToken,
    userId: session.userId.toString(),
  };
}

async function revokeRefreshToken(refreshToken: string): Promise<boolean> {
  const session = await RefreshTokenModel.findOne({ tokenHash: hashToken(refreshToken) }).exec();
  if (!session) return false;
  await revokeFamily(session.familyId);
  return true;
}

export const tokenService = {
  signAccessToken,
  verifyAccessToken,
  createRefreshSession,
  rotateRefreshToken,
  revokeRefreshToken,
  REFRESH_COOKIE_NAME,
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
};