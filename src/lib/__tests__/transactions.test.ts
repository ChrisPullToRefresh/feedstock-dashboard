import { beforeEach, describe, expect, it, vi } from "vitest";

const queryMock = vi.fn();
const PoolMock = vi.fn().mockImplementation(function Pool() {
  return { query: queryMock };
});

vi.mock("pg", () => ({ Pool: PoolMock }));
vi.mock("@vercel/functions", () => ({ attachDatabasePool: vi.fn() }));

describe("transactions data-access module", () => {
  beforeEach(() => {
    vi.resetModules();
    queryMock.mockReset();
    PoolMock.mockClear();
    process.env.DATABASE_URL = "postgres://user:pass@host/db";
  });

  it("create inserts an 'in' row with producer_id set and site_id null", async () => {
    const row = {
      id: 1,
      direction: "in",
      weight_kg: "120.5",
      producer_id: 7,
      site_id: null,
      recorded_by: "user_123",
      created_at: "2026-07-30T00:00:00.000Z",
    };
    queryMock.mockResolvedValue({ rows: [row] });
    const { create } = await import("../transactions");

    await expect(
      create({
        direction: "in",
        weightKg: 120.5,
        producerId: 7,
        siteId: null,
        recordedBy: "user_123",
      })
    ).resolves.toEqual(row);
    expect(queryMock).toHaveBeenCalledWith(
      "INSERT INTO transactions (direction, weight_kg, producer_id, site_id, recorded_by) VALUES ($1, $2, $3, $4, $5) RETURNING id, direction, weight_kg, producer_id, site_id, recorded_by, created_at",
      ["in", 120.5, 7, null, "user_123"]
    );
  });

  it("create inserts an 'out' row with site_id set and producer_id null", async () => {
    const row = {
      id: 2,
      direction: "out",
      weight_kg: "98.25",
      producer_id: null,
      site_id: 4,
      recorded_by: "user_456",
      created_at: "2026-07-30T00:05:00.000Z",
    };
    queryMock.mockResolvedValue({ rows: [row] });
    const { create } = await import("../transactions");

    await expect(
      create({
        direction: "out",
        weightKg: 98.25,
        producerId: null,
        siteId: 4,
        recordedBy: "user_456",
      })
    ).resolves.toEqual(row);
    expect(queryMock).toHaveBeenCalledWith(
      "INSERT INTO transactions (direction, weight_kg, producer_id, site_id, recorded_by) VALUES ($1, $2, $3, $4, $5) RETURNING id, direction, weight_kg, producer_id, site_id, recorded_by, created_at",
      ["out", 98.25, null, 4, "user_456"]
    );
  });

  it("list returns all rows ordered by created_at descending", async () => {
    const rows = [
      {
        id: 2,
        direction: "out",
        weight_kg: "98.25",
        producer_id: null,
        site_id: 4,
        recorded_by: "user_456",
        created_at: "2026-07-30T00:05:00.000Z",
      },
      {
        id: 1,
        direction: "in",
        weight_kg: "120.5",
        producer_id: 7,
        site_id: null,
        recorded_by: "user_123",
        created_at: "2026-07-30T00:00:00.000Z",
      },
    ];
    queryMock.mockResolvedValue({ rows });
    const { list } = await import("../transactions");

    await expect(list()).resolves.toEqual(rows);
    expect(queryMock).toHaveBeenCalledWith(
      "SELECT id, direction, weight_kg, producer_id, site_id, recorded_by, created_at FROM transactions ORDER BY created_at DESC",
      undefined
    );
  });
});
