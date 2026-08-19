import { describe, expect, it } from "vitest";

import { Prisma } from "@/generated/prisma/client";
import { Direction } from "@/generated/prisma/enums";
import {
  type MovementForTotals,
  type NamedCounterparty,
  rankCounterpartyTotals,
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

describe("a filtered set", () => {
  it("totals only the rows it was given", () => {
    // The page hands these functions the rows the filters selected, so nothing
    // outside that array may reach a figure on screen.
    const everything = [
      inbound("1000", "producer_a"),
      inbound("500", "producer_b"),
      outbound("250", "site_x"),
    ];
    const oneProducer = everything.filter(
      (movement) => movement.producerId === "producer_a",
    );

    expect(shown(totalInboundKg(oneProducer))).toBe("1000");
    expect(shown(totalOutboundKg(oneProducer))).toBe("0");
    expect([...totalByProducer(oneProducer).keys()]).toEqual(["producer_a"]);
  });

  it("keeps gram precision on the phase's own example", () => {
    // validation.md § Manual step 4 reads 2,350.5 kg off the screen. The
    // arithmetic that produces it is exact here or nowhere.
    const movements = [
      inbound("1250.5", "producer_a"),
      inbound("0.001", "producer_a"),
    ];

    expect(shown(totalInboundKg(movements))).toBe("1250.501");
  });
});

describe("a row's direction, not its columns", () => {
  it("never lands an outbound row under a producer", () => {
    // The check constraint makes this shape impossible in the database. The
    // grouping keys off `direction` regardless, so neither breakdown can pick
    // up the other's weight even if a row arrived carrying both ids.
    const impossible: MovementForTotals = {
      direction: Direction.OUTBOUND,
      weightKg: new Prisma.Decimal("900"),
      producerId: "producer_a",
      sequestrationSiteId: "site_x",
    };

    expect(totalByProducer([impossible]).size).toBe(0);
    expect(shown(totalBySequestrationSite([impossible]).get("site_x")!)).toBe(
      "900",
    );
  });

  it("never lands an inbound row under a site", () => {
    const impossible: MovementForTotals = {
      direction: Direction.INBOUND,
      weightKg: new Prisma.Decimal("800"),
      producerId: "producer_a",
      sequestrationSiteId: "site_x",
    };

    expect(totalBySequestrationSite([impossible]).size).toBe(0);
    expect(shown(totalByProducer([impossible]).get("producer_a")!)).toBe("800");
  });
});

describe("ranking a breakdown", () => {
  const named: NamedCounterparty[] = [
    { id: "producer_a", name: "Riverbend Sawmill", isActive: true },
    { id: "producer_b", name: "Larch Hollow", isActive: true },
    { id: "producer_c", name: "Alder Yard", isActive: false },
    { id: "producer_d", name: "Never Delivered", isActive: true },
  ];

  const rank = (movements: MovementForTotals[]) =>
    rankCounterpartyTotals(totalByProducer(movements), named);

  it("puts the heaviest first", () => {
    const rows = rank([
      inbound("300", "producer_b"),
      inbound("2050.5", "producer_a"),
      inbound("900", "producer_c"),
    ]);

    expect(rows.map((row) => row.name)).toEqual([
      "Riverbend Sawmill",
      "Alder Yard",
      "Larch Hollow",
    ]);
    expect(rows.map((row) => shown(row.totalKg))).toEqual([
      "2050.5",
      "900",
      "300",
    ]);
  });

  it("falls back to name when two weights are equal", () => {
    // Otherwise the order is free to move between one page load and the next,
    // and a breakdown nobody can read twice is not a breakdown.
    const rows = rank([
      inbound("500", "producer_b"),
      inbound("500", "producer_a"),
      inbound("500", "producer_c"),
    ]);

    expect(rows.map((row) => row.name)).toEqual([
      "Alder Yard",
      "Larch Hollow",
      "Riverbend Sawmill",
    ]);
  });

  it("leaves out a counterparty with no movements in the set", () => {
    const rows = rank([inbound("300", "producer_b")]);

    expect(rows.map((row) => row.id)).toEqual(["producer_b"]);
    expect(rows.some((row) => row.id === "producer_d")).toBe(false);
  });

  it("includes an archived counterparty, carrying its flag", () => {
    // requirements.md: archived counterparties that carry movement history are
    // still shown, still marked. Nothing here groups them beneath the rest.
    const rows = rank([
      inbound("2000", "producer_c"),
      inbound("300", "producer_a"),
    ]);

    expect(rows[0]).toMatchObject({ name: "Alder Yard", isActive: false });
    expect(rows[1]).toMatchObject({
      name: "Riverbend Sawmill",
      isActive: true,
    });
  });

  it("ranks an empty map as an empty breakdown", () => {
    expect(rankCounterpartyTotals(new Map(), named)).toEqual([]);
    expect(rank([])).toEqual([]);
  });

  it("skips a total no counterparty names", () => {
    // Unreachable from the page — the option queries return every
    // counterparty that has movements — but a row that cannot be named cannot
    // be rendered as the link the breakdown requires.
    const rows = rankCounterpartyTotals(
      new Map([["producer_unknown", new Prisma.Decimal("100")]]),
      named,
    );

    expect(rows).toEqual([]);
  });

  it("carries an exact total through to the row", () => {
    const rows = rank([
      inbound("1250.5", "producer_a"),
      inbound("0.001", "producer_a"),
    ]);

    expect(shown(rows[0]!.totalKg)).toBe("1250.501");
  });

  it("ranks a sequestration site breakdown the same way", () => {
    const sites: NamedCounterparty[] = [
      { id: "site_x", name: "Basin Store", isActive: true },
      { id: "site_y", name: "Ridge Vault", isActive: true },
    ];
    const rows = rankCounterpartyTotals(
      totalBySequestrationSite([
        outbound("250", "site_y"),
        outbound("900", "site_x"),
      ]),
      sites,
    );

    expect(rows.map((row) => row.name)).toEqual(["Basin Store", "Ridge Vault"]);
  });
});
