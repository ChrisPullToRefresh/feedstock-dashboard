import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
 * What matters here is that a second evaluation of the module reuses the first
 * client rather than building another one. Importing twice in the usual way
 * would prove nothing — the module registry alone would return the same object
 * — so each test resets the registry, which is what Next's dev server
 * effectively does on a hot reload.
 *
 * No connection is opened: PrismaClient constructs its adapter lazily, so a
 * placeholder URL is enough.
 */
const globalForDb = globalThis as typeof globalThis & { prisma?: unknown };

describe("the Prisma client singleton", () => {
  beforeEach(() => {
    process.env.DATABASE_URL =
      "postgresql://user:pw@localhost:5432/placeholder";
    delete globalForDb.prisma;
    vi.resetModules();
  });

  afterEach(() => {
    delete globalForDb.prisma;
    vi.unstubAllEnvs();
  });

  it("returns the same instance when the module is evaluated again", async () => {
    const first = (await import("@/lib/db")).db;

    vi.resetModules();
    const second = (await import("@/lib/db")).db;

    expect(second).toBe(first);
  });

  it("caches the instance on globalThis outside production", async () => {
    const { db } = await import("@/lib/db");

    expect(globalForDb.prisma).toBe(db);
  });

  it("does not cache on globalThis in production", async () => {
    // A production build evaluates the module once, so a global would keep the
    // client alive for no benefit.
    vi.stubEnv("NODE_ENV", "production");
    vi.resetModules();

    await import("@/lib/db");

    expect(globalForDb.prisma).toBeUndefined();
  });
});
