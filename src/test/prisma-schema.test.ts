import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

/*
 * These read `prisma/schema.prisma` as text rather than through the generated
 * client, because what they guard is not expressible in TypeScript: a default,
 * a uniqueness constraint, a referential action, and the snake_case names the
 * database actually uses. Regenerating the client from a changed schema would
 * keep a type-level test passing while the column names moved underneath it.
 *
 * validation.md § Automated → Schema shape is the list this covers.
 */
const schema = readFileSync("prisma/schema.prisma", "utf8");

/** The body of one `model X { ... }` or `enum X { ... }` block. */
function declarationBody(kind: "model" | "enum", name: string): string {
  const block = schema.match(
    new RegExp(String.raw`^${kind} ${name} \{$([\s\S]*?)^\}$`, "m"),
  );

  if (!block) {
    throw new Error(`prisma/schema.prisma declares no ${kind} ${name}`);
  }

  return block[1];
}

const modelBody = (name: string) => declarationBody("model", name);

describe("the reference-data models", () => {
  // Both models are deliberately identical in shape — plan.md § Decisions.
  // Testing them as one table keeps them that way: a field added to one and
  // forgotten on the other fails here.
  const models = [
    { model: "Producer", table: "producers" },
    { model: "SequestrationSite", table: "sequestration_sites" },
  ] as const;

  it.each(models)("$model has a cuid() primary key", ({ model }) => {
    expect(modelBody(model)).toMatch(
      /id\s+String\s+@id\s+@default\(cuid\(\)\)/,
    );
  });

  it.each(models)("$model has a unique name", ({ model }) => {
    // The seed upserts on this constraint — plan.md § Decisions, "The seed is
    // idempotent, upserting on name".
    expect(modelBody(model)).toMatch(/name\s+String\s+@unique/);
  });

  it.each(models)("$model is active by default", ({ model }) => {
    // A row is usable the moment it is created; archiving is the deliberate
    // act that clears this.
    expect(modelBody(model)).toMatch(
      /isActive\s+Boolean\s+@default\(true\)\s+@map\("is_active"\)/,
    );
  });

  it.each(models)("$model carries both timestamps", ({ model }) => {
    const body = modelBody(model);

    expect(body).toMatch(/createdAt\s+DateTime\s+@default\(now\(\)\)/);
    expect(body).toMatch(/updatedAt\s+DateTime\s+@updatedAt/);
  });

  it.each(models)("$model maps to the $table table", ({ model, table }) => {
    expect(modelBody(model)).toMatch(
      new RegExp(String.raw`@@map\("${table}"\)`),
    );
  });

  it.each(models)("$model maps every column to snake_case", ({ model }) => {
    const body = modelBody(model);

    // Anything camelCase in the schema needs an explicit @map, or the column
    // lands in Postgres quoted and mixed-case — plan.md § Decisions.
    for (const [field, column] of [
      ["isActive", "is_active"],
      ["createdAt", "created_at"],
      ["updatedAt", "updated_at"],
    ]) {
      expect(body).toMatch(
        new RegExp(String.raw`${field}\b[^\n]*@map\("${column}"\)`),
      );
    }
  });
});

describe("the Direction enum", () => {
  it("has exactly INBOUND and OUTBOUND", () => {
    const values = declarationBody("enum", "Direction")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "" && !line.startsWith("//"));

    // Exact, not a containment check: a third direction would silently escape
    // the counterparty check constraint, which only knows these two.
    expect(values).toEqual(["INBOUND", "OUTBOUND"]);
  });
});

describe("the Movement model", () => {
  const body = modelBody("Movement");

  it("has a cuid() primary key", () => {
    expect(body).toMatch(/id\s+String\s+@id\s+@default\(cuid\(\)\)/);
  });

  it("stores weight as an exact decimal to the gram", () => {
    // Decimal(12, 3) exactly — plan.md § Decisions. A double would not sum
    // exactly, and Phase 6's running totals are where that surfaces.
    expect(body).toMatch(
      /weightKg\s+Decimal\s+@map\("weight_kg"\)\s+@db\.Decimal\(12, 3\)/,
    );
  });

  it.each([
    { field: "producerId", column: "producer_id", model: "Producer" },
    {
      field: "sequestrationSiteId",
      column: "sequestration_site_id",
      model: "SequestrationSite",
    },
  ])("makes $field a nullable column", ({ field, column }) => {
    // Nullable because exactly one counterparty is set per movement; which
    // one is decided by direction, and enforced by the check constraint.
    expect(body).toMatch(
      new RegExp(String.raw`${field}\s+String\?\s+@map\("${column}"\)`),
    );
  });

  it.each([
    { relation: "producer", model: "Producer", field: "producerId" },
    {
      relation: "sequestrationSite",
      model: "SequestrationSite",
      field: "sequestrationSiteId",
    },
  ])(
    "refuses to delete a $model a movement references",
    ({ relation, model, field }) => {
      expect(body).toMatch(
        new RegExp(
          String.raw`${relation}\s+${model}\?\s+@relation\(fields: \[${field}\], references: \[id\], onDelete: Restrict\)`,
        ),
      );
    },
  );

  it("records the server clock when the row is written", () => {
    expect(body).toMatch(
      /recordedAt\s+DateTime\s+@default\(now\(\)\)\s+@map\("recorded_at"\)/,
    );
  });

  it("has no updatedAt, because a movement is never updated", () => {
    // The trigger in the initial migration is what enforces this; the absent
    // field is the schema agreeing with it.
    expect(body).not.toMatch(/updatedAt/);
  });

  it("maps to the movements table", () => {
    expect(body).toMatch(/@@map\("movements"\)/);
  });

  it.each(["producerId", "sequestrationSiteId"])("indexes %s", (field) => {
    // Prisma does not index relation scalars on PostgreSQL by itself, so
    // these are declared rather than inherited — and a dropped one would
    // only show up as a slow query much later.
    expect(body).toMatch(new RegExp(String.raw`@@index\(\[${field}\]\)`));
  });
});
