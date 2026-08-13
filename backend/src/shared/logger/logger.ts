import { pino, type Logger } from "pino";
import { env } from "../../config/env.js";

export const redactPaths = [
  "password",
  "passwords",
  "currentPassword",
  "newPassword",
  "token",
  "tokens",
  "refreshToken",
  "accessToken",
  "authorization",
  "req.headers.authorization",
  "req.headers.cookie",
  "res.headers['set-cookie']",
];

export const logger: Logger = pino({
  name: "accessorbit-api",
  level: env.LOG_LEVEL,
  base: { service: "accessorbit-api" },
  redact: {
    paths: redactPaths,
    censor: "[REDACTED]",
  },
  transport:
    env.NODE_ENV === "development"
      ? { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:HH:MM:ss" } }
      : undefined,
});