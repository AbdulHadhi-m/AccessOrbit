import { env } from "./config/env.js";
import { app } from "./app.js";
import { logger } from "./shared/logger/logger.js";
import { connectDatabase, disconnectDatabase } from "./database/connection.js";

async function bootstrap(): Promise<void> {
  await connectDatabase();

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, "AccessOrbit API listening");
  });

  const shutdown = (signal: string): void => {
    logger.info({ signal }, "Shutdown signal received");

    server.close(() => {
      void disconnectDatabase()
        .catch((err: unknown) => {
          logger.error({ err }, "Error while disconnecting database");
        })
        .finally(() => {
          process.exit(0);
        });
    });

    setTimeout(() => {
      logger.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10_000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

bootstrap().catch((err: unknown) => {
  logger.error({ err }, "Failed to start AccessOrbit API");
  process.exit(1);
});
