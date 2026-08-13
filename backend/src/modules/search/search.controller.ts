import type { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../shared/utils/response.js";
import { searchService } from "./search.service.js";
import { permissionResolutionService } from "../authorization/permission-resolution.service.js";

export async function handleSearch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query.q as string;
    let permissions = req.permissions;
    if (!permissions && req.user) {
      const resolved = await permissionResolutionService.resolvePermissionsForUser(req.user.id);
      permissions = resolved.permissions;
    }

    const data = await searchService.search({
      query: query || "",
      userId: req.user!.id,
      permissions: permissions || [],
    });
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export const searchController = {
  search: handleSearch,
};
