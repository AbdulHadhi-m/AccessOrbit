import type { NextFunction, Request, Response } from "express";
import { ForbiddenError, UnauthorizedError } from "../../shared/errors/index.js";
import { permissionResolutionService } from "./permission-resolution.service.js";

export function requirePermission(permissionKey: string) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Authentication required", "AUTH_UNAUTHORIZED");
      }

      const { permissions } = await permissionResolutionService.resolvePermissionsForUser(
        req.user.id
      );
      req.permissions = permissions;

      if (!permissions.includes(permissionKey)) {
        throw new ForbiddenError(
          "You do not have permission to perform this action",
          "AUTH_FORBIDDEN"
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}