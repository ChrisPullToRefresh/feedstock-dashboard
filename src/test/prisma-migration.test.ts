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

/*
 * Both reference-data tables carry one. Producers got theirs in Phase 3 and
 * sequestration sites in Phase 4, for the same reason: specs/roadmap.md Phase 6
 * groups totals by counterparty, and two spellings of one row would split the
 * numbers.
 */
describe.each([
  { entity: "producer", index: "producers_name_lower_key", table: "producers" },
  {
    entity: "sequestration site",
    index: "sequestration_sites_name_lower_key",
    table: "sequestration_sites",
  },
])("the case-insensitive unique index on $entity name", ({ index, table }) => {
  const sql = flatten(allMigrationSql());

  it("is still declared over lower(name)", () => {
    // Prisma cannot express an index over an expression, so nothing
    // regenerates these. Without the assertion, a migration recreated from
    // the schema would drop it and every other test would stay green while two
    // spellings of one row became possible again.
    expect(sql).toMatch(
      new RegExp(
        `CREATE UNIQUE INDEX "${index}" ON "${table}" \\(lower\\("name"\\)\\)`,
      ),
    );
  });

  it("is unique, not merely an index", () => {
    // A plain index would make the lookup fast and permit the duplicate.
    expect(sql).toContain(`CREATE UNIQUE INDEX "${index}"`);
  });
});

/*
 * The append-only trigger is the one guarantee of this data model that cannot
 * be repaired after the fact — `specs/mission.md` § Constraints makes movement
 * history immutable, and a movement rewritten while the trigger was missing
 * leaves no trace of having been.
 *
 * Like the constraint above it is hand-written SQL that nothing regenerates,
 * so a migration recreated from `schema.prisma` would arrive without it. These
 * assertions read text; the `Database` job in `.github/workflows/ci.yml` asks a
 * real Postgres whether an UPDATE is actually refused, which is the half no
 * search over SQL can answer.
 */
describe("the append-only trigger on movements", () => {
  const initial = flatten(initialMigrationSql());
  const everything = flatten(allMigrationSql());

  it("still declares the function that raises", () => {
    expect(initial).toContain(
      'CREATE OR REPLACE FUNCTION "reject_movement_mutation"() RETURNS TRIGGER',
    );
  });

  it("still fires before every update and delete, row by row", () => {
    // BEFORE, not AFTER: the exception has to stop the write rather than
    // follow it. FOR EACH ROW, not FOR EACH STATEMENT: a statement-level
    // trigger would let an UPDATE touching no rows pass and is not what the
    // constraint means.
    expect(initial).toContain(
      'CREATE TRIGGER "movements_are_append_only" BEFORE UPDATE OR DELETE ON "movements" FOR EACH ROW EXECUTE FUNCTION "reject_movement_mutation"()',
    );
  });

  it("is not dropped by any later migration", () => {
    // The failure this exists for: the trigger survives review because it is
    // in the initial migration, and a later migration removes it.
    expect(everything).not.toMatch(
      /DROP TRIGGER[^;]*movements_are_append_only/,
    );
    expect(everything).not.toMatch(
      /DROP FUNCTION[^;]*reject_movement_mutation/,
    );
  });

  it("is not left behind by a later migration recreating the table", () => {
    // Dropping "movements" takes its triggers with it, silently. Nothing in
    // this project should ever do that to an append-only table.
    expect(everything).not.toMatch(/DROP TABLE[^;]*"movements"/);
  });
});
