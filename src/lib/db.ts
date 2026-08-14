import { PrismaNeon } from "@prisma/adapter-neon";

import { PrismaClient } from "@/generated/prisma/client";

/**
 * The Prisma client every piece of server code shares.
 *
 * Prisma 7 has no query engine of its own, so the connection is supplied by a
 * driver adapter. Neon's is the one that matches the database: the pooled
 * `DATABASE_URL` runs PgBouncer in transaction mode, which Neon's own driver
 * is built for. Migrations use the unpooled URL instead — see
 * `prisma.config.ts` — because a pooler cannot hold Prisma Migrate's lock.
 *
 * The instance is cached on `globalThis` outside production because Next's dev
 * server re-evaluates modules on every hot reload. Without the cache each
 * reload would open another connection pool and leak the last one, until Neon
 * refuses new connections. Production builds evaluate a module once, so
 * caching there would only keep a global alive for no benefit.
 */
const createPrismaClient = () =>
  new PrismaClient({
    adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
  });

const globalForDb = globalThis as typeof globalThis & {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const db = globalForDb.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForDb.prisma = db;
}
