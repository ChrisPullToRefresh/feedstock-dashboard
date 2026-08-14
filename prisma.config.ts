import { existsSync } from "node:fs";

import { defineConfig, env } from "prisma/config";

// Prisma 7 does not read env files on its own, and this project keeps local
// secrets in .env.local — the file `vercel env pull` writes. In CI and on
// Vercel the variables are already in the environment and no file exists,
// which is what the guard is for.
if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Migrations need a direct connection: Prisma Migrate takes an advisory
    // lock that Neon's pooled endpoint cannot hold.
    url: env("DATABASE_URL_UNPOOLED"),
  },
  migrations: {
    // Kept identical to the `seed` script in package.json, so a database
    // rebuilt by `prisma migrate reset` comes back with the same reference
    // data as one seeded by hand.
    seed: "node --env-file-if-exists=.env.local --disable-warning=MODULE_TYPELESS_PACKAGE_JSON prisma/seed.ts",
  },
});
