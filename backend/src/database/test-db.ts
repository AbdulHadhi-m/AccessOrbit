import type { Model } from "mongoose";
import { connectDatabase, disconnectDatabase } from "./connection.js";
import { ALL_MODELS } from "./models/index.js";

export const connectTestDb = connectDatabase;

export async function clearTestDb(): Promise<void> {
  await Promise.all(
    ALL_MODELS.map((model) => (model as Model<unknown>).deleteMany({}).exec())
  );
}

export const disconnectTestDb = disconnectDatabase;