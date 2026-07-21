import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "node --env-file=../../.env --import tsx/esm prisma/seed.ts",
  },
  datasource: {
    url:
      process.env.DATABASE_URL ||
      "postgresql://verttex:verttex_dev_password@localhost:5433/verttex_db?schema=public",
  },
});
