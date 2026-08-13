import type { RequestHandler } from "express";
import { HttpStatus } from "../../shared/constants/http.js";
import { sendSuccess, sendFailure } from "../../shared/utils/response.js";
import { DB_STATES, getDatabaseState } from "../../database/connection.js";
import { APP_NAME } from "../../shared/constants/api.js";

export interface HealthData {
  status: "ok" | "degraded";
  database: "up" | "down";
  uptime: number;
}

export const healthController: RequestHandler = (_req, res) => {
  const databaseUp = getDatabaseState() === DB_STATES.CONNECTED;
  const data: HealthData = {
    status: databaseUp ? "ok" : "degraded",
    database: databaseUp ? "up" : "down",
    uptime: Math.round(process.uptime()),
  };

  if (databaseUp) {
    sendSuccess(res, data, { message: `${APP_NAME} API is healthy` });
    return;
  }

  sendFailure(
    res,
    HttpStatus.SERVICE_UNAVAILABLE,
    "SERVICE_UNAVAILABLE",
    "Database is unavailable",
    [{ field: "database", message: "MongoDB is not connected" }]
  );
};
