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
const createPrismaClient = () =>
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

const globalForDb = globalThis as typeof globalThis & {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const db = globalForDb.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForDb.prisma = db;
}
