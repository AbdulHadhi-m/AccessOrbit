import express from "express";
import helmet from "helmet";
import cors from "cors";
import { env } from "./config/env.js";
import { API_PREFIX } from "./shared/constants/api.js";
import { requestId } from "./shared/middleware/request-id.js";
import { httpLogger } from "./shared/logger/http-logger.js";
import { apiLimiter } from "./shared/middleware/rate-limit.js";
import { notFoundHandler } from "./shared/middleware/not-found.js";
import { errorHandler } from "./shared/middleware/error-handler.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { testRouter } from "./modules/test/test.routes.js";

export const app = express();

app.disable("x-powered-by");

if (env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(requestId);
app.use(httpLogger);
app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

app.use(API_PREFIX, apiLimiter);
app.use(API_PREFIX, healthRouter);
app.use(`${API_PREFIX}/auth`, authRouter);
app.use(`${API_PREFIX}/test`, testRouter);

app.use(notFoundHandler);
app.use(errorHandler);
