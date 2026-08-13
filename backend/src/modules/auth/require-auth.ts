import type { NextFunction, Request, Response } from "express";
import { ForbiddenError, UnauthorizedError } from "../../shared/errors/index.js";
import { userRepository } from "../users/user.repository.js";
import { tokenService } from "./token.service.js";

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedError("Access token is required", "AUTH_UNAUTHORIZED");
    }

    const payload = tokenService.verifyAccessToken(header.slice("Bearer ".length).trim());

    const user = await userRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedError("User no longer exists", "AUTH_UNAUTHORIZED");
    }
    if (user.status !== "active") {
      throw new ForbiddenError("This account has been disabled", "AUTH_USER_DISABLED");
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      roleIds: (user.roleIds ?? []).map((id) => id.toString()),
      status: user.status,
    };
    next();
  } catch (error) {
    next(error);
  }
}