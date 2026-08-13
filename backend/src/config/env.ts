import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().max(65535).default(4000),
  MONGODB_URI: z
    .string()
    .min(1, "MONGODB_URI is required (e.g. mongodb://localhost:27017/accessorbit)")
    .url(),
  FRONTEND_URL: z.string().min(1, "FRONTEND_URL is required (e.g. http://localhost:3000)").url(),
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  SEED_ADMIN_EMAIL: z.string().email().optional(),
  SEED_ADMIN_PASSWORD: z.string().min(8).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console -- logger is not available yet (circular import)
  console.error("Invalid environment configuration:");
  for (const issue of parsed.error.issues) {
    // eslint-disable-next-line no-console -- fail-fast before logger exists
    console.error(`  - ${issue.path.join(".") || "(root)"}: ${issue.message}`);
  }
  // eslint-disable-next-line no-console -- fail-fast before logger exists
  console.error("Copy backend/.env.example to backend/.env and set valid values.");
  process.exit(1);
}

export const env = parsed.data;
