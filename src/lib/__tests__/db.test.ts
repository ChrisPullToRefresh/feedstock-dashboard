import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const queryMock = vi.fn();
const PoolMock = vi.fn().mockImplementation(function Pool() {
  return { query: queryMock };
});
const attachDatabasePoolMock = vi.fn();

vi.mock("pg", () => ({ Pool: PoolMock }));
vi.mock("@vercel/functions", () => ({
  attachDatabasePool: attachDatabasePoolMock,
}));

describe("db connection module", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    vi.resetModules();
    queryMock.mockReset();
    PoolMock.mockClear();
    attachDatabasePoolMock.mockClear();
    process.env.DATABASE_URL = "postgres://user:pass@host/db";
  });

  afterEach(() => {
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  it("constructs a client from the DATABASE_URL env var", async () => {
    await import("../db");
    expect(PoolMock).toHaveBeenCalledWith({
      connectionString: "postgres://user:pass@host/db",
    });
    expect(attachDatabasePoolMock).toHaveBeenCalled();
  });

  it("throws if DATABASE_URL is not set", async () => {
    delete process.env.DATABASE_URL;
    await expect(import("../db")).rejects.toThrow(
      "DATABASE_URL environment variable is not set"
    );
  });

  it("healthCheck resolves true when the query succeeds", async () => {
    queryMock.mockResolvedValue({ rowCount: 1 });
    const { healthCheck } = await import("../db");
    await expect(healthCheck()).resolves.toBe(true);
    expect(queryMock).toHaveBeenCalledWith("SELECT 1");
  });

  it("healthCheck resolves false when the query returns no rows", async () => {
    queryMock.mockResolvedValue({ rowCount: 0 });
    const { healthCheck } = await import("../db");
    await expect(healthCheck()).resolves.toBe(false);
  });
});
