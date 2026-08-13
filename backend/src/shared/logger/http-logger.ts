import { pinoHttp } from "pino-http";
import { randomUUID } from "node:crypto";
import type { Response } from "express";
import { logger, redactPaths } from "./logger.js";

export const httpLogger = pinoHttp({
  logger,
  redact: { paths: redactPaths, censor: "[REDACTED]" },
  genReqId: (_req, res) =>
    ((res as Response).locals.requestId as string | undefined) ?? randomUUID(),
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
    }),
  },
  autoLogging: { ignore: (req) => req.url === "/api/v1/health" },
});