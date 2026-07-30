import { describe, expect, it } from "vitest";
import lint from "@commitlint/lint";
import load from "@commitlint/load";

const WELL_FORMED = [
  "feat: add commitlint config",
  "fix(shell): correct nav landmark label",
  "docs(readme): document commit conventions",
  "chore: bump dependency versions",
];

const MALFORMED = [
  "added stuff", // missing type
  "feat: Add Stuff.", // not imperative-looking noise / trailing period
  "feat: " + "a".repeat(70), // oversized summary line
];

describe("commitlint config", () => {
  it("accepts well-formed Conventional Commits messages", async () => {
    const { rules } = await load();

    for (const message of WELL_FORMED) {
      const result = await lint(message, rules);
      expect(result.valid, `expected "${message}" to be valid`).toBe(true);
    }
  });

  it("rejects malformed commit messages", async () => {
    const { rules } = await load();

    for (const message of MALFORMED) {
      const result = await lint(message, rules);
      expect(result.valid, `expected "${message}" to be invalid`).toBe(false);
    }
  });
});
