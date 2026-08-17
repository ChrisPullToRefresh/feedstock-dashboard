import { describe, expect, it } from "vitest";

import {
  REFERENCE_NAME_MAX_LENGTH,
  producerNameSchema,
  producerSchema,
  sequestrationSiteNameSchema,
  sequestrationSiteSchema,
} from "@/lib/reference-data";

/*
 * One set of rules, two entities — `plan.md` § Decisions. Every rule is
 * asserted against both schemas, so a change that quietly applies to one and
 * not the other fails here rather than in a form.
 */
const entities = [
  {
    entity: "producer",
    nameSchema: producerNameSchema,
    schema: producerSchema,
    missing: "Enter a producer name",
  },
  {
    entity: "sequestration site",
    nameSchema: sequestrationSiteNameSchema,
    schema: sequestrationSiteSchema,
    missing: "Enter a sequestration site name",
  },
];

describe.each(entities)(
  "the $entity name schema",
  ({ nameSchema, missing }) => {
    it.each([
      { entered: "", why: "empty" },
      { entered: "   ", why: "whitespace only" },
      { entered: "\t\n ", why: "whitespace only, other characters" },
    ])("refuses a name that is $why", ({ entered }) => {
      expect(nameSchema.safeParse(entered).success).toBe(false);
    });

    it("refuses a name longer than the column allows", () => {
      const tooLong = "a".repeat(REFERENCE_NAME_MAX_LENGTH + 1);

      expect(nameSchema.safeParse(tooLong).success).toBe(false);
    });

    it("accepts a name at the limit", () => {
      // The boundary itself is valid — only what exceeds it is refused.
      const atLimit = "a".repeat(REFERENCE_NAME_MAX_LENGTH);

      expect(nameSchema.safeParse(atLimit).success).toBe(true);
    });

    it.each([
      { entered: "  Cascade Timber Mill  ", stored: "Cascade Timber Mill" },
      { entered: "\tHarney Basin Storage\n", stored: "Harney Basin Storage" },
      { entered: "High Desert Ranch", stored: "High Desert Ranch" },
    ])("parses $entered to $stored", ({ entered, stored }) => {
      expect(nameSchema.parse(entered)).toBe(stored);
    });

    it("trims before measuring length, not after", () => {
      // A name at the limit with padding either side is still valid: the padding
      // is not part of what gets stored.
      const padded = `  ${"a".repeat(REFERENCE_NAME_MAX_LENGTH)}  `;

      expect(nameSchema.safeParse(padded).success).toBe(true);
    });

    it("says something a form can show when a name is missing", () => {
      const result = nameSchema.safeParse("");

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe(missing);
    });
  },
);

describe.each(entities)("the $entity object schema", ({ schema }) => {
  it("parses a name into a trimmed object", () => {
    expect(schema.parse({ name: "  Larch Hollow  " })).toEqual({
      name: "Larch Hollow",
    });
  });

  it("refuses an object with no name at all", () => {
    expect(schema.safeParse({}).success).toBe(false);
  });
});

describe("the rules the two entities share", () => {
  it("gives both the same length limit", () => {
    // The bound is defined once. This fails if someone reintroduces a
    // per-entity maximum, which `plan.md` § Decisions rejected.
    const tooLong = "a".repeat(REFERENCE_NAME_MAX_LENGTH + 1);

    expect(producerNameSchema.safeParse(tooLong).success).toBe(false);
    expect(sequestrationSiteNameSchema.safeParse(tooLong).success).toBe(false);
  });

  it("names the entity the operator was creating when a name is missing", () => {
    // The rules are shared; the words are not. A sequestration site form
    // saying "Enter a producer name" is the failure this guards.
    expect(producerNameSchema.safeParse("").error?.issues[0]?.message).not.toBe(
      sequestrationSiteNameSchema.safeParse("").error?.issues[0]?.message,
    );
  });
});
