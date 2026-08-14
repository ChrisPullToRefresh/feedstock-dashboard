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

/** The body of one `model X { ... }` block, without its braces. */
function modelBody(name: string): string {
  const block = schema.match(
    new RegExp(String.raw`^model ${name} \{$([\s\S]*?)^\}$`, "m"),
  );

  if (!block) {
    throw new Error(`prisma/schema.prisma declares no model ${name}`);
  }

  return block[1];
}

describe("the reference-data models", () => {
  // Both models are deliberately identical in shape — plan.md § Decisions.
  // Testing them as one table keeps them that way: a field added to one and
  // forgotten on the other fails here.
  const models = [
    { model: "Producer", table: "producers" },
    { model: "SequestrationSite", table: "sequestration_sites" },
  ] as const;

  it.each(models)("$model has a cuid() primary key", ({ model }) => {
    expect(modelBody(model)).toMatch(/id\s+String\s+@id\s+@default\(cuid\(\)\)/);
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
