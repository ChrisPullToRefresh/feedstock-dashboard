import { describe, expect, it } from "vitest";

import { Prisma } from "@/generated/prisma/client";
import {
  formatWeightKg,
  parseWeightKg,
  type WeightRejection,
} from "@/lib/weight";

describe("parsing an entered weight", () => {
  it.each([
    { entered: "1250", expected: "1250" },
    { entered: "1250.5", expected: "1250.5" },
    { entered: "0.001", expected: "0.001" },
    { entered: "999999999.999", expected: "999999999.999" },
    // What a keypad and a pair of thumbs actually produce.
    { entered: "  42  ", expected: "42" },
  ])("reads $entered as $expected kilograms", ({ entered, expected }) => {
    const result = parseWeightKg(entered);

    expect(result.ok).toBe(true);
    // Compared through the Decimal rather than as a JS number: the point of
    // the type is that it does not go through a float on the way in.
    expect(
      result.ok && result.weightKg.equals(new Prisma.Decimal(expected)),
    ).toBe(true);
  });

  it.each<{ entered: string; reason: WeightRejection }>([
    { entered: "", reason: "empty" },
    { entered: "   ", reason: "empty" },
    { entered: "abc", reason: "not-a-number" },
    { entered: "12kg", reason: "not-a-number" },
    // Rejected rather than quietly read as 1200: a phone keypad does not
    // produce these, so one is a mistake rather than a formatted number.
    { entered: "1,200", reason: "not-a-number" },
    { entered: "1e3", reason: "not-a-number" },
    { entered: "1.2.3", reason: "not-a-number" },
    { entered: "-5", reason: "not-positive" },
    { entered: "-0.5", reason: "not-positive" },
    { entered: "0", reason: "not-positive" },
    { entered: "0.000", reason: "not-positive" },
    // The column holds grams; a fourth decimal place would be rounded away
    // silently, so it is refused instead.
    { entered: "1.2345", reason: "too-precise" },
  ])("refuses $entered as $reason", ({ entered, reason }) => {
    const result = parseWeightKg(entered);

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toBe(reason);
  });

  it("tells the rejections apart", () => {
    // The point of separate reasons is that a form can say something
    // different about each, so no two of these may collapse.
    const reasons = ["", "abc", "-1", "1.2345"].map((entered) => {
      const result = parseWeightKg(entered);
      return result.ok ? "accepted" : result.reason;
    });

    expect(new Set(reasons).size).toBe(reasons.length);
  });
});

describe("formatting a stored weight", () => {
  it.each([
    { stored: "1250.500", shown: "1,250.5" },
    { stored: "1250", shown: "1,250" },
    { stored: "999999999.999", shown: "999,999,999.999" },
    { stored: "0.001", shown: "0.001" },
    { stored: "42", shown: "42" },
    { stored: "1000", shown: "1,000" },
    { stored: "999", shown: "999" },
  ])("shows $stored as $shown", ({ stored, shown }) => {
    expect(formatWeightKg(new Prisma.Decimal(stored))).toBe(shown);
  });

  it("round-trips a parsed weight back to what was entered", () => {
    const result = parseWeightKg("1250.5");

    expect(result.ok && formatWeightKg(result.weightKg)).toBe("1,250.5");
  });
});
