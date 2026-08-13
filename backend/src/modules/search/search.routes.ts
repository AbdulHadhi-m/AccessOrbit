import { Router } from "express";
import { z } from "zod";
import { validate } from "../../shared/middleware/validate.js";
import { requireAuth } from "../auth/require-auth.js";
import { searchController } from "./search.controller.js";

const searchQuerySchema = z.object({
  q: z.string().trim().min(2).max(100),
});

export const searchRouter = Router();

searchRouter.get(
  "/",
  requireAuth,
  validate(searchQuerySchema, "query"),
  searchController.search
);
