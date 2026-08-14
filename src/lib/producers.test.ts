import { describe, expect, it } from "vitest";

import {
  PRODUCER_NAME_MAX_LENGTH,
  producerNameSchema,
  producerSchema,
} from "@/lib/producers";

describe("the producer name schema", () => {
  it.each([
    { entered: "", why: "empty" },
    { entered: "   ", why: "whitespace only" },
    { entered: "\t\n ", why: "whitespace only, other characters" },
  ])("refuses a name that is $why", ({ entered }) => {
    expect(producerNameSchema.safeParse(entered).success).toBe(false);
  });

  it("refuses a name longer than the column allows", () => {
    const tooLong = "a".repeat(PRODUCER_NAME_MAX_LENGTH + 1);

    expect(producerNameSchema.safeParse(tooLong).success).toBe(false);
  });

  it("accepts a name at the limit", () => {
    // The boundary itself is valid — only what exceeds it is refused.
    const atLimit = "a".repeat(PRODUCER_NAME_MAX_LENGTH);

    expect(producerNameSchema.safeParse(atLimit).success).toBe(true);
  });

  it.each([
    { entered: "  Cascade Timber Mill  ", stored: "Cascade Timber Mill" },
    { entered: "\tRiverbend Sawmill\n", stored: "Riverbend Sawmill" },
    { entered: "High Desert Ranch", stored: "High Desert Ranch" },
  ])("parses $entered to $stored", ({ entered, stored }) => {
    expect(producerNameSchema.parse(entered)).toBe(stored);
  });

  it("trims before measuring length, not after", () => {
    // A name at the limit with padding either side is still valid: the padding
    // is not part of what gets stored.
    const padded = `  ${"a".repeat(PRODUCER_NAME_MAX_LENGTH)}  `;

    expect(producerNameSchema.safeParse(padded).success).toBe(true);
  });

  it("says something a form can show when a name is missing", () => {
    const result = producerNameSchema.safeParse("");

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Enter a producer name");
  });
});

describe("the producer object schema", () => {
  it("parses a name into a trimmed object", () => {
    expect(producerSchema.parse({ name: "  Larch Hollow  " })).toEqual({
      name: "Larch Hollow",
    });
  });

  it("refuses an object with no name at all", () => {
    expect(producerSchema.safeParse({}).success).toBe(false);
  });
});
