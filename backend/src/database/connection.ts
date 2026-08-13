import mongoose from "mongoose";
import { env } from "../config/env.js";
import { logger } from "../shared/logger/logger.js";

export const DB_STATES = {
  DISCONNECTED: 0,
  CONNECTED: 1,
  CONNECTING: 2,
  DISCONNECTING: 3,
} as const;

export async function connectDatabase(): Promise<void> {
  mongoose.connection.on("connected", () => {
    logger.info("MongoDB connected");
  });

  mongoose.connection.on("error", (err) => {
    logger.error({ err }, "MongoDB connection error");
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
  });

  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info("MongoDB disconnected");
}

export function getDatabaseState(): number {
  return mongoose.connection.readyState;
}
