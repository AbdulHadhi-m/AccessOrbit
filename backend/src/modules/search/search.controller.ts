import type { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../shared/utils/response.js";
import { searchService } from "./search.service.js";

export async function handleSearch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query.q as string;
    const data = await searchService.search({
      query: query || "",
      userId: req.user!.id,
      permissions: req.permissions || [],
    });
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export const searchController = {
  search: handleSearch,
};
