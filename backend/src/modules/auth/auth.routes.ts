import { Router } from "express";
import { strictLimiter } from "../../shared/middleware/rate-limit.js";
import { validate } from "../../shared/middleware/validate.js";
import { requireAuth } from "./require-auth.js";
import { loginSchema } from "./auth.validators.js";
import { login, logout, me, refresh } from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/login", validate(loginSchema), strictLimiter, login);
authRouter.post("/refresh", strictLimiter, refresh);
authRouter.post("/logout", requireAuth, logout);
authRouter.get("/me", requireAuth, me);