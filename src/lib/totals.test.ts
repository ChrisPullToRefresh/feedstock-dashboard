import { describe, expect, it } from "vitest";

import { Prisma } from "@/generated/prisma/client";
import { Direction } from "@/generated/prisma/enums";
import {
  type MovementForTotals,
  totalByProducer,
  totalBySequestrationSite,
  totalInboundKg,
  totalOutboundKg,
} from "@/lib/totals";

const inbound = (weightKg: string, producerId: string): MovementForTotals => ({
  direction: Direction.INBOUND,
  weightKg: new Prisma.Decimal(weightKg),
  producerId,
  sequestrationSiteId: null,
});

const outbound = (
  weightKg: string,
  sequestrationSiteId: string,
): MovementForTotals => ({
  direction: Direction.OUTBOUND,
  weightKg: new Prisma.Decimal(weightKg),
  producerId: null,
  sequestrationSiteId,
});

/** Totals are Decimals; comparing their strings keeps failures readable. */
const shown = (total: Prisma.Decimal) => total.toString();

describe("totals over an empty set", () => {
  it("returns zero for both directions", () => {
    expect(shown(totalInboundKg([]))).toBe("0");
    expect(shown(totalOutboundKg([]))).toBe("0");
  });

  it("groups nothing", () => {
    expect(totalByProducer([]).size).toBe(0);
    expect(totalBySequestrationSite([]).size).toBe(0);
  });
});

describe("totals over mixed directions", () => {
  const movements = [
    inbound("1000", "producer_a"),
    outbound("250.5", "site_x"),
    inbound("500.25", "producer_b"),
    outbound("100", "site_y"),
    inbound("2000", "producer_a"),
  ];

  it("separates inbound from outbound", () => {
    expect(shown(totalInboundKg(movements))).toBe("3500.25");
    expect(shown(totalOutboundKg(movements))).toBe("350.5");
  });

  it("sums repeat visits from the same producer", () => {
    const byProducer = totalByProducer(movements);

    expect(shown(byProducer.get("producer_a")!)).toBe("3000");
    expect(shown(byProducer.get("producer_b")!)).toBe("500.25");
  });

  it("groups outbound weight by sequestration site", () => {
    const bySite = totalBySequestrationSite(movements);

    expect(shown(bySite.get("site_x")!)).toBe("250.5");
    expect(shown(bySite.get("site_y")!)).toBe("100");
  });

  it("keys each movement off the counterparty its direction implies", () => {
    // Producers are an inbound idea and sites an outbound one, so neither
    // grouping may pick up the other's rows.
    expect([...totalByProducer(movements).keys()].sort()).toEqual([
      "producer_a",
      "producer_b",
    ]);
    expect([...totalBySequestrationSite(movements).keys()].sort()).toEqual([
      "site_x",
      "site_y",
    ]);
  });
});

describe("exactness", () => {
  it("sums values that would drift as binary floats", () => {
    // 0.1 + 0.2 is 0.30000000000000004 in binary floating point. Ten of them
    // compound the error, which is exactly what a column of weights does.
    const movements = Array.from({ length: 10 }, () =>
      inbound("0.1", "producer_a"),
    );

    expect(shown(totalInboundKg(movements))).toBe("1");

    // The same sum through JS numbers, to show the test is not vacuous.
    const asFloats = Array.from({ length: 10 }, () => 0.1).reduce(
      (a, b) => a + b,
      0,
    );
    expect(asFloats).not.toBe(1);
  });

  it("keeps gram precision across a large total", () => {
    const movements = [
      inbound("999999.999", "producer_a"),
      inbound("0.001", "producer_a"),
    ];

    expect(shown(totalInboundKg(movements))).toBe("1000000");
    expect(shown(totalByProducer(movements).get("producer_a")!)).toBe(
      "1000000",
    );
  });
});
