import { logger } from "../../shared/logger/logger.js";
import { connectDatabase, disconnectDatabase } from "../connection.js";
import { runSeed } from "./seed.js";

async function main(): Promise<void> {
  await connectDatabase();
  const summary = await runSeed();
  logger.info({ summary }, "Seed completed");
  await disconnectDatabase();
}

main().catch((err: unknown) => {
  logger.error({ err }, "Seed failed");
  void disconnectDatabase().finally(() => process.exit(1));
});