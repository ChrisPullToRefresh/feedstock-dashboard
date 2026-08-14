import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/*
 * The counterparty check constraint is hand-written SQL: Prisma cannot express
 * it, so nothing regenerates it. Someone who recreates the initial migration
 * from the schema would get a migration without it, and every schema-shape
 * test would still pass while the database quietly accepted an inbound
 * movement bound for a sequestration site.
 *
 * This test is that guard. It asserts the SQL is present, not that it works —
 * validation.md § Manual steps 4-7 prove the behavior against a real database.
 */
const MIGRATIONS_DIR = "prisma/migrations";

/** The earliest checked-in migration — the one that creates the schema. */
function initialMigrationSql(): string {
  const migrations = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    // Prisma prefixes every directory with a UTC timestamp, so lexicographic
    // order is chronological order.
    .sort();

  if (migrations.length === 0) {
    throw new Error(`${MIGRATIONS_DIR} contains no migration`);
  }

  return readFileSync(
    join(MIGRATIONS_DIR, migrations[0], "migration.sql"),
    "utf8",
  );
}

/** Every checked-in migration's SQL, concatenated in chronological order. */
function allMigrationSql(): string {
  return readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .map((name) =>
      readFileSync(join(MIGRATIONS_DIR, name, "migration.sql"), "utf8"),
    )
    .join("\n");
}

/** Collapses runs of whitespace so assertions do not depend on formatting. */
const flatten = (sql: string) => sql.replace(/\s+/g, " ");

describe("the initial migration's counterparty check constraint", () => {
  const sql = flatten(initialMigrationSql());

  it("is still named in the migration", () => {
    expect(sql).toContain(
      'ADD CONSTRAINT "movements_counterparty_matches_direction" CHECK',
    );
  });

  it("requires an inbound movement to carry a producer and no site", () => {
    expect(sql).toContain(
      `"direction" = 'INBOUND' AND "producer_id" IS NOT NULL AND "sequestration_site_id" IS NULL`,
    );
  });

  it("requires an outbound movement to carry a site and no producer", () => {
    expect(sql).toContain(
      `"direction" = 'OUTBOUND' AND "sequestration_site_id" IS NOT NULL AND "producer_id" IS NULL`,
    );
  });

  it("applies the constraint to the movements table", () => {
    expect(sql).toMatch(
      /ALTER TABLE "movements" ADD CONSTRAINT "movements_counterparty_matches_direction"/,
    );
  });
});

describe("the case-insensitive unique index on producer name", () => {
  const sql = flatten(allMigrationSql());

  it("is still declared over lower(name)", () => {
    // Prisma cannot express an index over an expression, so nothing
    // regenerates this one. Without the assertion, a migration recreated from
    // the schema would drop it and every other test would stay green while two
    // spellings of one producer became possible again.
    expect(sql).toMatch(
      /CREATE UNIQUE INDEX "producers_name_lower_key" ON "producers" \(lower\("name"\)\)/,
    );
  });

  it("is unique, not merely an index", () => {
    // A plain index would make the lookup fast and permit the duplicate.
    expect(sql).toContain('CREATE UNIQUE INDEX "producers_name_lower_key"');
  });
});
