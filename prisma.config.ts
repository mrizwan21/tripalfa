import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "database/prisma/schema.prisma",
  migrations: {
    path: "database/prisma/migrations",
  },
  datasource: {
    // Neon Cloud only — never falls back to static/local DB
    url: env("DIRECT_DATABASE_URL") || env("DATABASE_URL"),
  },
});
