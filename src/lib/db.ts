import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

/**
 * The Prisma client every piece of server code shares.
 *
 * Prisma 7 has no query engine of its own, so the connection is supplied by a
 * driver adapter. This one speaks ordinary Postgres over TCP, which Neon's
 * pooled `DATABASE_URL` accepts and so does any stock Postgres — that is what
 * lets the Database CI job exercise this same code against a throwaway
 * database. node-postgres sends unnamed statements, so PgBouncer's transaction
 * pooling has nothing to trip over. Migrations use the unpooled URL instead —
 * see `prisma.config.ts` — because a pooler cannot hold Prisma Migrate's lock.
 *
 * The instance is cached on `globalThis` outside production because Next's dev
 * server re-evaluates modules on every hot reload. Without the cache each
 * reload would open another connection pool and leak the last one, until the
 * database refuses new connections. Production builds evaluate a module once,
 * so caching there would only keep a global alive for no benefit.
 */
const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL;

  // Checked rather than passed through as undefined: node-postgres would then
  // fall back to libpq defaults and the PG* variables — which this project's
  // Neon integration also sets — so a missing URL would either reach an
  // unintended host or surface as a bare ECONNREFUSED on localhost at the
  // first query, well away from the actual mistake.
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set — run `vercel env pull .env.local` first",
    );
  }

  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
};

const globalForDb = globalThis as typeof globalThis & {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const db = globalForDb.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForDb.prisma = db;
}
