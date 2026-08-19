import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MovementBreakdown } from "@/components/movement-breakdown";
import { Prisma } from "@/generated/prisma/client";
import {
  rankCounterpartyTotals,
  totalByProducer,
  totalBySequestrationSite,
  type CounterpartyTotal,
  type MovementForTotals,
} from "@/lib/totals";
import { Direction } from "@/generated/prisma/enums";

const total = (
  id: string,
  name: string,
  totalKg: string,
  isActive = true,
): CounterpartyTotal => ({
  id,
  name,
  isActive,
  totalKg: new Prisma.Decimal(totalKg),
});

function renderInbound(rows: readonly CounterpartyTotal[]) {
  render(
    <MovementBreakdown
      heading="Inbound by producer"
      columnLabel="Producer"
      rows={rows}
      basePath="/producers"
      emptyMessage="No inbound movements match these filters."
    />,
  );
}

/** The body rows, in the order they were rendered. */
const bodyRows = () =>
  screen
    .getAllByRole("row")
    .filter((row) => within(row).queryAllByRole("cell").length > 0);

describe("a breakdown", () => {
  it("renders its rows heaviest first, as they were ranked", () => {
    renderInbound([
      total("producer_a", "Riverbend Sawmill", "2050.5"),
      total("producer_b", "Larch Hollow", "300"),
    ]);

    expect(bodyRows().map((row) => row.textContent)).toEqual([
      expect.stringContaining("Riverbend Sawmill"),
      expect.stringContaining("Larch Hollow"),
    ]);
  });

  it("links every name to its detail page", () => {
    renderInbound([
      total("producer_a", "Riverbend Sawmill", "2050.5"),
      total("producer_b", "Larch Hollow", "300"),
    ]);

    expect(
      screen.getByRole("link", { name: "Riverbend Sawmill" }),
    ).toHaveAttribute("href", "/producers/producer_a");
    expect(screen.getByRole("link", { name: "Larch Hollow" })).toHaveAttribute(
      "href",
      "/producers/producer_b",
    );
  });

  it("marks an archived name and still links it", () => {
    renderInbound([total("producer_c", "Alder Yard", "2050.5", false)]);

    expect(screen.getByRole("link", { name: "Alder Yard" })).toHaveAttribute(
      "href",
      "/producers/producer_c",
    );
    expect(screen.getByText("Archived")).toBeVisible();
  });

  it("renders each weight exact and in kilograms", () => {
    renderInbound([
      total("producer_a", "Riverbend Sawmill", "2050.500"),
      total("producer_b", "Larch Hollow", "300.001"),
    ]);

    expect(screen.getByText("2,050.5 kg")).toBeVisible();
    expect(screen.getByText("300.001 kg")).toBeVisible();
  });

  it("renders its own line rather than a bare heading when empty", () => {
    // A heading with nothing under it reads as a breakdown that failed to
    // load, which under a direction filter is the ordinary case.
    renderInbound([]);

    expect(
      screen.getByRole("heading", { name: "Inbound by producer" }),
    ).toBeVisible();
    expect(
      screen.getByText("No inbound movements match these filters."),
    ).toBeVisible();
    expect(screen.queryAllByRole("table")).toHaveLength(0);
  });

  it("renders no empty line when it has rows", () => {
    renderInbound([total("producer_a", "Riverbend Sawmill", "2050.5")]);

    expect(
      screen.queryByText("No inbound movements match these filters."),
    ).not.toBeInTheDocument();
  });
});

describe("the outbound breakdown", () => {
  it("renders sites against the same shape, linked to their own pages", () => {
    const movements: MovementForTotals[] = [
      {
        direction: Direction.OUTBOUND,
        weightKg: new Prisma.Decimal("250"),
        producerId: null,
        sequestrationSiteId: "site_y",
      },
      {
        direction: Direction.OUTBOUND,
        weightKg: new Prisma.Decimal("900"),
        producerId: null,
        sequestrationSiteId: "site_x",
      },
    ];

    render(
      <MovementBreakdown
        heading="Outbound by sequestration site"
        columnLabel="Sequestration site"
        rows={rankCounterpartyTotals(totalBySequestrationSite(movements), [
          { id: "site_x", name: "Basin Store", isActive: true },
          { id: "site_y", name: "Ridge Vault", isActive: true },
        ])}
        basePath="/sites"
        emptyMessage="No outbound movements match these filters."
      />,
    );

    expect(bodyRows().map((row) => row.textContent)).toEqual([
      expect.stringContaining("Basin Store"),
      expect.stringContaining("Ridge Vault"),
    ]);
    expect(screen.getByRole("link", { name: "Basin Store" })).toHaveAttribute(
      "href",
      "/sites/site_x",
    );
  });

  it("shows nothing under a producer when the rows are all outbound", () => {
    // Inbound weight is only ever attributed to a producer, which is what the
    // check constraint already guarantees.
    renderInbound(
      rankCounterpartyTotals(
        totalByProducer([
          {
            direction: Direction.OUTBOUND,
            weightKg: new Prisma.Decimal("900"),
            producerId: null,
            sequestrationSiteId: "site_x",
          },
        ]),
        [{ id: "producer_a", name: "Riverbend Sawmill", isActive: true }],
      ),
    );

    expect(
      screen.getByText("No inbound movements match these filters."),
    ).toBeVisible();
  });
});
