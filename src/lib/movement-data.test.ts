import { describe, expect, it } from "vitest";

import { Direction } from "@/generated/prisma/enums";
import {
  CLEARED_FILTERS_HREF,
  COUNTERPARTY_SINGULAR,
  type CounterpartyFilterOption,
  DEFAULT_LIMIT,
  filterHref,
  formatRecordedAt,
  hasAnyFilter,
  MAX_LIMIT,
  MAX_WEIGHT_KG,
  type MovementFilters,
  movementListHref,
  movementSchema,
  type MovementSearchParams,
  NO_FILTERS,
  pageAtLimit,
  parseMovementFilters,
  showMoreHref,
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

/*
 * The movement list's URL contract — `plan.md` § Decisions makes
 * `/?direction=INBOUND&producer=<id>` the entire state of the page, so these
 * are the cases that keep a hand-typed or stale URL from becoming an error.
 */

const producers: CounterpartyFilterOption[] = [
  { id: "producer_a", name: "Riverbend Sawmill", isActive: true },
  { id: "producer_b", name: "Larch Hollow", isActive: false },
];

const sites: CounterpartyFilterOption[] = [
  { id: "site_x", name: "Basin Store", isActive: true },
];

const options = { producers, sites };

const parse = (searchParams: MovementSearchParams) =>
  parseMovementFilters(searchParams, options);

describe("reading the URL", () => {
  it("parses a bare path as nothing narrowed", () => {
    expect(parse({})).toEqual(NO_FILTERS);
  });

  it("reads all three filters and the limit", () => {
    expect(
      parse({
        direction: Direction.INBOUND,
        producer: "producer_a",
        site: "site_x",
        limit: "300",
      }),
    ).toEqual({
      direction: Direction.INBOUND,
      producerId: "producer_a",
      sequestrationSiteId: "site_x",
      limit: 300,
    });
  });

  it.each(["inbound", "SIDEWAYS", "", "   "])(
    "treats %s as no direction rather than as an error",
    (direction) => {
      expect(parse({ direction }).direction).toBeNull();
    },
  );

  it("treats a counterparty id nobody offers as unset", () => {
    // Not as a filter matching nothing: a Select handed a value none of its
    // items has renders a blank trigger, so the page would show an empty table
    // above a control that looks untouched.
    expect(parse({ producer: "producer_gone" }).producerId).toBeNull();
    expect(parse({ site: "producer_a" }).sequestrationSiteId).toBeNull();
  });

  it("offers an archived counterparty like any other", () => {
    // The filters follow the table — requirements.md. A name in the table that
    // no filter can isolate would be a table nobody can narrow.
    expect(parse({ producer: "producer_b" }).producerId).toBe("producer_b");
  });

  it.each(["abc", "-1", "0", "1e3", "100.5", "99999999", ""])(
    "falls back to the default limit for %s",
    (limit) => {
      expect(parse({ limit }).limit).toBe(DEFAULT_LIMIT);
    },
  );

  it("honors a limit below the default", () => {
    // What makes `?limit=2` a usable way to walk Show more without bulk data —
    // validation.md § Manual step 9.
    expect(parse({ limit: "2" }).limit).toBe(2);
  });

  it("honors the largest limit and refuses the one past it", () => {
    expect(parse({ limit: String(MAX_LIMIT) }).limit).toBe(MAX_LIMIT);
    expect(parse({ limit: String(MAX_LIMIT + 1) }).limit).toBe(DEFAULT_LIMIT);
  });

  it("treats a repeated parameter as unset", () => {
    // No control on this page produces one, so it is not guessed at.
    expect(
      parse({ direction: [Direction.INBOUND, Direction.OUTBOUND] }),
    ).toEqual(NO_FILTERS);
  });
});

describe("building the URL", () => {
  const all: MovementFilters = {
    direction: Direction.INBOUND,
    producerId: "producer_a",
    sequestrationSiteId: "site_x",
    limit: DEFAULT_LIMIT,
  };

  it("leaves the default limit off, so an unfiltered list is a bare path", () => {
    expect(movementListHref(NO_FILTERS)).toBe("/");
    expect(CLEARED_FILTERS_HREF).toBe("/");
  });

  it("carries every filter that is set", () => {
    expect(movementListHref(all)).toBe(
      "/?direction=INBOUND&producer=producer_a&site=site_x",
    );
  });

  it("preserves the other two filters when one changes", () => {
    expect(filterHref(all, { direction: Direction.OUTBOUND })).toBe(
      "/?direction=OUTBOUND&producer=producer_a&site=site_x",
    );
    expect(filterHref(all, { producerId: "producer_b" })).toBe(
      "/?direction=INBOUND&producer=producer_b&site=site_x",
    );
    expect(filterHref(all, { sequestrationSiteId: null })).toBe(
      "/?direction=INBOUND&producer=producer_a",
    );
  });

  it("drops the limit when a filter changes, so a new filter starts at 100", () => {
    expect(
      filterHref({ ...all, limit: 500 }, { direction: Direction.OUTBOUND }),
    ).toBe("/?direction=OUTBOUND&producer=producer_a&site=site_x");
  });

  it("clears to a bare path when every filter goes", () => {
    expect(
      filterHref(all, {
        direction: null,
        producerId: null,
        sequestrationSiteId: null,
      }),
    ).toBe("/");
  });

  it("raises the limit by a hundred and touches nothing else", () => {
    expect(showMoreHref(all)).toBe(
      "/?direction=INBOUND&producer=producer_a&site=site_x&limit=200",
    );
    expect(showMoreHref({ ...NO_FILTERS, limit: 2 })).toBe("/?limit=102");
  });

  it("never asks for more than the parser will accept", () => {
    // Without the clamp this would build `?limit=10100`, which parseLimit
    // refuses and falls back to 100 — tapping Show more at the cap would
    // collapse the table instead of growing it.
    expect(showMoreHref({ ...NO_FILTERS, limit: MAX_LIMIT })).toBe(
      `/?limit=${MAX_LIMIT}`,
    );
    expect(showMoreHref({ ...NO_FILTERS, limit: MAX_LIMIT - 50 })).toBe(
      `/?limit=${MAX_LIMIT}`,
    );
  });

  it("builds the See all link a detail page needs", () => {
    expect(filterHref(NO_FILTERS, { producerId: "producer_a" })).toBe(
      "/?producer=producer_a",
    );
    expect(filterHref(NO_FILTERS, { sequestrationSiteId: "site_x" })).toBe(
      "/?site=site_x",
    );
  });
});

describe("whether a Clear filters control belongs", () => {
  it("is absent with nothing narrowed", () => {
    expect(hasAnyFilter(NO_FILTERS)).toBe(false);
  });

  it("is absent for a raised limit alone", () => {
    // The limit narrows nothing, so clearing it would be a control that
    // appears to do nothing.
    expect(hasAnyFilter({ ...NO_FILTERS, limit: 500 })).toBe(false);
  });

  it.each([
    { direction: Direction.OUTBOUND },
    { producerId: "producer_a" },
    { sequestrationSiteId: "site_x" },
  ])("is present once %o is set", (change) => {
    expect(hasAnyFilter({ ...NO_FILTERS, ...change })).toBe(true);
  });
});

describe("when a movement was recorded", () => {
  it("renders an absolute date and time with the zone named", () => {
    expect(formatRecordedAt(new Date("2026-08-18T13:45:09.000Z"))).toBe(
      "18 Aug 2026, 13:45 UTC",
    );
  });

  it("pads the day and the time so a column of them aligns", () => {
    expect(formatRecordedAt(new Date("2026-01-05T09:05:00.000Z"))).toBe(
      "05 Jan 2026, 09:05 UTC",
    );
  });

  it("renders midnight as 00:00 on the day it begins", () => {
    expect(formatRecordedAt(new Date("2026-12-31T00:00:00.000Z"))).toBe(
      "31 Dec 2026, 00:00 UTC",
    );
  });

  it("renders the same string whatever zone the process keeps", () => {
    // The assertion that keeps this independent of where it runs. A local
    // format would put two people comparing screens on different numbers for
    // the same row, and would shift the date across the line either way.
    const instant = new Date("2026-08-18T23:30:00.000Z");
    const original = process.env.TZ;

    const rendered = ["Pacific/Kiritimati", "Pacific/Midway", "UTC"].map(
      (zone) => {
        process.env.TZ = zone;
        return formatRecordedAt(instant);
      },
    );

    process.env.TZ = original;

    expect(new Set(rendered).size).toBe(1);
    expect(rendered[0]).toBe("18 Aug 2026, 23:30 UTC");
  });
});

describe("the page the query returned", () => {
  const rows = [1, 2, 3];

  it("renders the limit's worth and reports there is more", () => {
    // The query takes limit + 1 rows, so the extra one answers "is there
    // more" without a second count. It is never rendered.
    expect(pageAtLimit(rows, 2)).toEqual({ visible: [1, 2], hasMore: true });
  });

  it("reports no more when exactly the limit came back", () => {
    expect(pageAtLimit(rows, 3)).toEqual({
      visible: [1, 2, 3],
      hasMore: false,
    });
  });

  it("reports no more when fewer than the limit came back", () => {
    expect(pageAtLimit(rows, DEFAULT_LIMIT)).toEqual({
      visible: [1, 2, 3],
      hasMore: false,
    });
  });

  it("handles nothing at all", () => {
    expect(pageAtLimit([], DEFAULT_LIMIT)).toEqual({
      visible: [],
      hasMore: false,
    });
  });

  it("reports no more at the cap, however many rows came back", () => {
    // There is nowhere further to go, and a control that cannot show more must
    // not say it can.
    const atTheCap = Array.from({ length: MAX_LIMIT + 1 }, (_, n) => n);

    expect(pageAtLimit(atTheCap, MAX_LIMIT).hasMore).toBe(false);
    expect(pageAtLimit(atTheCap, MAX_LIMIT).visible).toHaveLength(MAX_LIMIT);
    // One short of it, the control still belongs.
    expect(pageAtLimit(atTheCap, MAX_LIMIT - 1).hasMore).toBe(true);
  });
});
