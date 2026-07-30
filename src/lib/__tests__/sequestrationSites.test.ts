import { beforeEach, describe, expect, it, vi } from "vitest";

const queryMock = vi.fn();
const PoolMock = vi.fn().mockImplementation(function Pool() {
  return { query: queryMock };
});

vi.mock("pg", () => ({ Pool: PoolMock }));
vi.mock("@vercel/functions", () => ({ attachDatabasePool: vi.fn() }));

describe("sequestration sites data-access module", () => {
  beforeEach(() => {
    vi.resetModules();
    queryMock.mockReset();
    PoolMock.mockClear();
    process.env.DATABASE_URL = "postgres://user:pass@host/db";
  });

  it("list returns all rows", async () => {
    const rows = [
      { id: 1, name: "North Site", created_at: "2026-07-01T00:00:00.000Z" },
      { id: 2, name: "South Site", created_at: "2026-07-02T00:00:00.000Z" },
    ];
    queryMock.mockResolvedValue({ rows });
    const { list } = await import("../sequestrationSites");

    await expect(list()).resolves.toEqual(rows);
    expect(queryMock).toHaveBeenCalledWith(
      "SELECT id, name, created_at FROM sequestration_sites ORDER BY name",
      undefined
    );
  });

  it("create inserts and returns the new row", async () => {
    const row = { id: 3, name: "New Site", created_at: "2026-07-03T00:00:00.000Z" };
    queryMock.mockResolvedValue({ rows: [row] });
    const { create } = await import("../sequestrationSites");

    await expect(create("New Site")).resolves.toEqual(row);
    expect(queryMock).toHaveBeenCalledWith(
      "INSERT INTO sequestration_sites (name) VALUES ($1) RETURNING id, name, created_at",
      ["New Site"]
    );
  });
});
