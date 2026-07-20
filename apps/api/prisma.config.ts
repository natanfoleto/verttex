import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url:
      process.env.DATABASE_URL ||
      "postgresql://verttex:verttex_dev_password@localhost:5432/verttex_db?schema=public",
  },
});
