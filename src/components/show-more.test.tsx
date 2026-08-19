import { cleanup, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MovementList } from "@/components/movement-list";
import { MovementTotals } from "@/components/movement-totals";
import { ShowMore } from "@/components/show-more";
import { Prisma } from "@/generated/prisma/client";
import { Direction } from "@/generated/prisma/enums";
import {
  NO_FILTERS,
  pageAtLimit,
  type MovementFilters,
} from "@/lib/movement-data";
import type { ListedMovement } from "@/lib/movement-queries";
import type { MovementForTotals } from "@/lib/totals";

/*
 * The cap and its control. The boundary is a number — `limit + 1` against
 * `limit` is the only interesting case — so it is proven here rather than on a
 * screen; validation.md § Manual step 9 walks the control itself with the
 * limit lowered.
 */

const movement = (n: number): ListedMovement => ({
  id: `m${n}`,
  direction: Direction.INBOUND,
  weightKg: new Prisma.Decimal("100"),
  recordedAt: new Date("2026-08-18T13:45:00.000Z"),
  producer: { id: `producer_${n}`, name: `Producer ${n}`, isActive: true },
  sequestrationSite: null,
});

const forTotals = (weightKg: string): MovementForTotals => ({
  direction: Direction.INBOUND,
  weightKg: new Prisma.Decimal(weightKg),
  producerId: "producer_a",
  sequestrationSiteId: null,
});

/**
 * What the page assembles: the totals over every matching row, and the table
 * over the `limit + 1` rows the other query returned.
 */
function renderResults({
  returned,
  everyMatchingRow,
  filters = NO_FILTERS,
}: {
  returned: ListedMovement[];
  everyMatchingRow: MovementForTotals[];
  filters?: MovementFilters;
}) {
  const { visible, hasMore } = pageAtLimit(returned, filters.limit);

  render(
    <>
      <MovementTotals movements={everyMatchingRow} />
      <MovementList movements={visible} />
      {hasMore ? <ShowMore filters={filters} /> : null}
    </>,
  );
}

/** The stacked layout's rows — one per movement, whatever the width. */
const renderedRows = () => screen.getAllByRole("listitem");

/** Every matching row, so the totals have something to be steady about. */
const FIVE_HUNDRED_KG = [
  forTotals("100"),
  forTotals("100"),
  forTotals("100"),
  forTotals("100"),
  forTotals("100"),
];

const FIVE_RETURNED = [1, 2, 3, 4, 5].map(movement);

describe("the cap and Show more", () => {
  it("renders the limit's worth of rows and the control when there is more", () => {
    // The query took limit + 1 rows. The extra one is the answer to "is there
    // more", and is never rendered.
    renderResults({
      returned: [1, 2, 3].map(movement),
      everyMatchingRow: FIVE_HUNDRED_KG,
      filters: { ...NO_FILTERS, limit: 2 },
    });

    expect(renderedRows()).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Show more" })).toBeVisible();
  });

  it("renders no control when exactly the limit came back", () => {
    renderResults({
      returned: [1, 2].map(movement),
      everyMatchingRow: FIVE_HUNDRED_KG,
      filters: { ...NO_FILTERS, limit: 2 },
    });

    expect(renderedRows()).toHaveLength(2);
    expect(
      screen.queryByRole("link", { name: "Show more" }),
    ).not.toBeInTheDocument();
  });

  it("renders no control when fewer than the limit came back", () => {
    renderResults({
      returned: FIVE_RETURNED,
      everyMatchingRow: FIVE_HUNDRED_KG,
    });

    expect(renderedRows()).toHaveLength(5);
    expect(
      screen.queryByRole("link", { name: "Show more" }),
    ).not.toBeInTheDocument();
  });

  it("renders the same totals whether the table is capped or not", () => {
    // This is the assertion that pins the second query's purpose. The totals
    // come from every matching row, so they do not move when Show more does.
    renderResults({
      returned: [1, 2, 3].map(movement),
      everyMatchingRow: FIVE_HUNDRED_KG,
      filters: { ...NO_FILTERS, limit: 2 },
    });

    expect(renderedRows()).toHaveLength(2);
    expect(screen.getByText("500 kg")).toBeVisible();
    expect(screen.getByRole("link", { name: "Show more" })).toBeVisible();

    // One tap later: the same filters, the limit raised, every row loaded.
    cleanup();

    renderResults({
      returned: FIVE_RETURNED,
      everyMatchingRow: FIVE_HUNDRED_KG,
      filters: { ...NO_FILTERS, limit: 102 },
    });

    expect(renderedRows()).toHaveLength(5);
    expect(screen.getByText("500 kg")).toBeVisible();
    expect(
      screen.queryByRole("link", { name: "Show more" }),
    ).not.toBeInTheDocument();
  });

  it("raises the limit by a hundred and keeps every filter", () => {
    renderResults({
      returned: [1, 2, 3].map(movement),
      everyMatchingRow: FIVE_HUNDRED_KG,
      filters: {
        direction: Direction.INBOUND,
        producerId: "producer_a",
        sequestrationSiteId: null,
        limit: 2,
      },
    });

    expect(screen.getByRole("link", { name: "Show more" })).toHaveAttribute(
      "href",
      "/?direction=INBOUND&producer=producer_a&limit=102",
    );
  });

  it("puts the control below the rows it extends", () => {
    renderResults({
      returned: [1, 2, 3].map(movement),
      everyMatchingRow: FIVE_HUNDRED_KG,
      filters: { ...NO_FILTERS, limit: 2 },
    });

    const list = screen.getAllByRole("list")[0]!;
    const control = screen.getByRole("link", { name: "Show more" });

    expect(
      list.compareDocumentPosition(control) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(within(list).queryByText("Show more")).not.toBeInTheDocument();
  });
});
