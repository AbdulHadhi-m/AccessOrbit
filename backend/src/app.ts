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
import { userRouter } from "./modules/users/user.routes.js";
import { roleRouter } from "./modules/roles/role.routes.js";
import { moduleRouter } from "./modules/modules/module.routes.js";
import { subModuleRouter } from "./modules/modules/sub-module.routes.js";
import { operationRouter } from "./modules/modules/operation.routes.js";
import { permissionRouter } from "./modules/permissions/permission.routes.js";
import { docsRouter } from "./modules/docs/docs.routes.js";

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
app.use(`${API_PREFIX}/users`, userRouter);
app.use(`${API_PREFIX}/roles`, roleRouter);
app.use(`${API_PREFIX}/modules`, moduleRouter);
app.use(`${API_PREFIX}/sub-modules`, subModuleRouter);
app.use(`${API_PREFIX}/operations`, operationRouter);
app.use(`${API_PREFIX}/permissions`, permissionRouter);
app.use(`${API_PREFIX}/docs`, docsRouter);

app.use(notFoundHandler);
app.use(errorHandler);
