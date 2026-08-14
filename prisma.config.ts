import { existsSync } from "node:fs";

import { defineConfig } from "prisma/config";

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
    //
    // Read straight from the environment rather than through Prisma's env()
    // helper, which throws when the variable is absent. This file is loaded by
    // every Prisma command, including the `prisma generate` that `postinstall`
    // runs — so throwing here would break `npm ci` on a fresh clone and in the
    // Lint, Typecheck and Test jobs, none of which have a database URL and
    // none of which need one to generate a client. The migrate commands that
    // do need it fail on their own if it is missing.
    url: process.env.DATABASE_URL_UNPOOLED,
  },
  migrations: {
    // Kept identical to the `seed` script in package.json, so a database
    // rebuilt by `prisma migrate reset` comes back with the same reference
    // data as one seeded by hand.
    seed: "node --env-file-if-exists=.env.local --disable-warning=MODULE_TYPELESS_PACKAGE_JSON prisma/seed.ts",
  },
});
