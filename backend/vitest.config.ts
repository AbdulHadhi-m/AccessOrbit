import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    fileParallelism: false,
    env: {
      MONGODB_URI: "mongodb://localhost:27017/accessorbit_test",
      SEED_ADMIN_EMAIL: "admin@accessorbit.test",
      SEED_ADMIN_PASSWORD: "TestAdminPass123!",
    },
    testTimeout: 15_000,
    hookTimeout: 30_000,
  },
});