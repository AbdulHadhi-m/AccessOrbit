import type { NextFunction, Request, Response } from "express";
import { env } from "../../config/env.js";
import { sendSuccess } from "../../shared/utils/response.js";
import { clearCookie, serializeCookie } from "../../shared/utils/cookie.js";
import { UnauthorizedError } from "../../shared/errors/index.js";
import { authService } from "./auth.service.js";
import {
  REFRESH_COOKIE_NAME,
  REFRESH_TOKEN_TTL_SECONDS,
  tokenService,
} from "./token.service.js";

function refreshCookieOptions() {
  const isProduction = env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ("none" as const) : ("lax" as const),
    path: "/api/v1/auth",
    maxAgeSeconds: REFRESH_TOKEN_TTL_SECONDS,
  };
}

function setRefreshCookie(res: Response, refreshToken: string): void {
  res.setHeader(
    "Set-Cookie",
    serializeCookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions())
  );
}

function clearRefreshCookie(res: Response): void {
  res.setHeader("Set-Cookie", clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions()));
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    setRefreshCookie(res, result.refreshToken);
    sendSuccess(res, { user: result.user, accessToken: result.accessToken, expiresIn: tokenService.ACCESS_TOKEN_TTL_SECONDS }, { message: "Login successful" });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const refreshToken = readRefreshToken(req);
    const result = await authService.refresh(refreshToken);
    setRefreshCookie(res, result.refreshToken);
    sendSuccess(res, { user: result.user, accessToken: result.accessToken, expiresIn: tokenService.ACCESS_TOKEN_TTL_SECONDS }, { message: "Token refreshed" });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const refreshToken = readRefreshToken(req);
    await authService.logout(refreshToken);
    clearRefreshCookie(res);
    sendSuccess(res, undefined, { message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError("Access token is required", "AUTH_UNAUTHORIZED");
    const user = await authService.toSafeUser(req.user.id);
    sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
}

function readRefreshToken(req: Request): string {
  const cookies = req.headers.cookie ?? "";
  const token = cookies
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${REFRESH_COOKIE_NAME}=`))
    ?.split("=").slice(1).join("=");

  if (!token) {
    throw new UnauthorizedError("Refresh token is required", "AUTH_REFRESH_INVALID");
  }
  return decodeURIComponent(token);
}