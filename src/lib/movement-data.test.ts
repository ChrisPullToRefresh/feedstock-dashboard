import { describe, expect, it } from "vitest";

import { Direction } from "@/generated/prisma/enums";
import {
  COUNTERPARTY_SINGULAR,
  MAX_WEIGHT_KG,
  movementSchema,
  WEIGHT_REFUSALS,
  weightKgSchema,
} from "@/lib/movement-data";

/*
 * The browser's half of the two-sided validation in `plan.md` § Decisions.
 * These are the boundaries the form is trusted to catch before a round trip,
 * and the cases that keep this schema agreeing with `parseWeightKg` — which
 * refuses the same five ways and is tested in `weight.test.ts`.
 */

/** The message a refusal produced, or null if the value was accepted. */
function refusalFor(entered: string): string | null {
  const result = weightKgSchema.safeParse(entered);

  return result.success ? null : (result.error.issues[0]?.message ?? "");
}

describe("an entered weight", () => {
  it.each([
    { entered: "1250", parsed: "1250" },
    { entered: "1250.5", parsed: "1250.5" },
    { entered: "0.001", parsed: "0.001" },
    { entered: "12.345", parsed: "12.345" },
    { entered: MAX_WEIGHT_KG, parsed: MAX_WEIGHT_KG },
    // What a keypad and a pair of thumbs actually produce.
    { entered: "  1250  ", parsed: "1250" },
  ])("accepts $entered as $parsed", ({ entered, parsed }) => {
    const result = weightKgSchema.safeParse(entered);

    expect(result.success).toBe(true);
    expect(result.success && result.data).toBe(parsed);
  });

  it("refuses nothing at all", () => {
    expect(refusalFor("")).toBe(WEIGHT_REFUSALS.empty);
    expect(refusalFor("   ")).toBe(WEIGHT_REFUSALS.empty);
  });

  it.each(["abc", "1e3", "1,250", "1250kg", "12.", ".5", "1.2.3", "--5"])(
    "refuses %s as not a number",
    (entered) => {
      expect(refusalFor(entered)).toBe(WEIGHT_REFUSALS.notANumber);
    },
  );

  it.each(["0", "0.000", "-5", "-0.001"])(
    "refuses %s as not a weight worth recording",
    (entered) => {
      expect(refusalFor(entered)).toBe(WEIGHT_REFUSALS.notPositive);
    },
  );

  it.each(["12.3456", "1.0000", "999999999.9991"])(
    "refuses %s as more precise than a gram",
    (entered) => {
      expect(refusalFor(entered)).toBe(WEIGHT_REFUSALS.tooPrecise);
    },
  );

  it.each(["1000000000", "1000000000.001", "9999999999"])(
    "refuses %s as larger than the column holds",
    (entered) => {
      expect(refusalFor(entered)).toBe(WEIGHT_REFUSALS.tooLarge);
    },
  );

  it("gives each refusal its own message", () => {
    const messages = Object.values(WEIGHT_REFUSALS);

    // The form picks which control an error belongs under by the state it is
    // handed, never by matching on prose — but two identical messages would
    // still mean an operator could not tell two mistakes apart.
    expect(new Set(messages).size).toBe(messages.length);
  });

  it("compares against the bound exactly, not through a float", () => {
    // 999999999.999 is past the point where a float represents its own
    // boundary reliably. The schema counts grams as BigInt for this reason.
    expect(refusalFor("999999999.999")).toBeNull();
    expect(refusalFor("1000000000.000")).toBe(WEIGHT_REFUSALS.tooLarge);
  });
});

describe("a movement entry", () => {
  it.each([
    { direction: Direction.INBOUND, singular: "producer" },
    { direction: Direction.OUTBOUND, singular: "sequestration site" },
  ])("names the $singular when none is chosen", ({ direction, singular }) => {
    expect(COUNTERPARTY_SINGULAR[direction]).toBe(singular);

    const result = movementSchema(singular).safeParse({
      weightKg: "1250",
      counterpartyId: "",
    });

    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0]?.message).toBe(
      `Select a ${singular}`,
    );
  });

  it("accepts a weight and a counterparty together", () => {
    const result = movementSchema("producer").safeParse({
      weightKg: " 1250.5 ",
      counterpartyId: "prd_1",
    });

    expect(result.success).toBe(true);
    expect(result.success && result.data).toEqual({
      weightKg: "1250.5",
      counterpartyId: "prd_1",
    });
  });

  it("refuses a bad weight even when a counterparty is chosen", () => {
    const result = movementSchema("producer").safeParse({
      weightKg: "0",
      counterpartyId: "prd_1",
    });

    expect(result.success).toBe(false);
  });
});
