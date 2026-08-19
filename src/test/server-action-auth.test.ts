import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Every Server Action verifies a session before it writes.
 *
 * `src/proxy.ts` is the first line and this is the second — Next's own
 * guidance is that the gate should not be the only one, and this project has
 * already shipped two holes in that regular expression
 * (`specs/roadmap.md` Phase 3). See `src/lib/require-user.ts`.
 *
 * Read as text rather than executed, for the same reason
 * `src/test/prisma-migration.test.ts` reads the migration SQL: what needs
 * guarding is not that today's actions behave, but that tomorrow's action
 * cannot be added without the check. Calling each action would prove the
 * former and miss the latter entirely.
 */

const ACTION_FILES = [
  "src/app/(app)/producers/actions.ts",
  "src/app/(app)/sites/actions.ts",
  "src/app/(app)/record/actions.ts",
] as const;

const read = (file: string) => readFileSync(join(process.cwd(), file), "utf8");

/** Every `export async function name(` in a file, in source order. */
function exportedActions(source: string): string[] {
  return [...source.matchAll(/export async function (\w+)\s*\(/g)].map(
    (match) => match[1]!,
  );
}

/**
 * The body of one function, from its signature to the next top-level `}`.
 * Good enough because every action in these files is a top-level declaration.
 */
function bodyOf(source: string, name: string): string {
  const start = source.indexOf(`export async function ${name}`);
  const end = source.indexOf("\n}", start);

  return source.slice(start, end);
}

describe.each(ACTION_FILES)("%s", (file) => {
  const source = read(file);
  const actions = exportedActions(source);

  it("exports at least one Server Action", () => {
    // Guards the guard: a rename that empties this list would otherwise make
    // every assertion below vacuously pass.
    expect(actions.length).toBeGreaterThan(0);
  });

  it("is a server module", () => {
    expect(source.startsWith('"use server";')).toBe(true);
  });

  it.each(actions)("%s verifies the session", (action) => {
    const body = bodyOf(source, action);

    // Either the action checks directly, or it delegates to a helper in the
    // same file that does — `record()` is the second shape.
    const guarded =
      body.includes("await requireUser()") ||
      /return record\(/.test(body) ||
      /return parse\w+\(/.test(body);

    expect(guarded, `${action} does not call requireUser()`).toBe(true);
  });
});

describe("the private helpers that actions delegate to", () => {
  it("guards record(), which both movement actions call", () => {
    const source = read("src/app/(app)/record/actions.ts");
    const start = source.indexOf("async function record(");
    const body = source.slice(start, source.indexOf("\n}", start));

    expect(body).toContain("await requireUser()");
  });
});
