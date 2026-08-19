import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MovementList } from "@/components/movement-list";
import { Prisma } from "@/generated/prisma/client";
import { Direction } from "@/generated/prisma/enums";
import type { ListedMovement } from "@/lib/movement-queries";

/*
 * One array renders twice — the stacked rows a phone gets and the table
 * desktop gets. Every assertion here reads both, because the point of the
 * layout is that they are one design at two widths, not two designs.
 */

const inbound = (
  id: string,
  weightKg: string,
  producer: { id: string; name: string; isActive?: boolean },
  recordedAt = "2026-08-18T13:45:00.000Z",
): ListedMovement => ({
  id,
  direction: Direction.INBOUND,
  weightKg: new Prisma.Decimal(weightKg),
  recordedAt: new Date(recordedAt),
  producer: { isActive: true, ...producer },
  sequestrationSite: null,
});

const outbound = (
  id: string,
  weightKg: string,
  site: { id: string; name: string; isActive?: boolean },
  recordedAt = "2026-08-18T14:00:00.000Z",
): ListedMovement => ({
  id,
  direction: Direction.OUTBOUND,
  weightKg: new Prisma.Decimal(weightKg),
  recordedAt: new Date(recordedAt),
  producer: null,
  sequestrationSite: { isActive: true, ...site },
});

/** The stacked layout's rows and the table's rows, separately. */
function layouts() {
  return {
    stacked: screen.getAllByRole("listitem"),
    // The header row is a row too; the body rows are the ones with cells.
    table: screen
      .getAllByRole("row")
      .filter((row) => within(row).queryAllByRole("cell").length > 0),
  };
}

describe("the movement table", () => {
  it("renders every row in the order it was given, at both widths", () => {
    render(
      <MovementList
        movements={[
          outbound("m3", "250", { id: "site_y", name: "Ridge Vault" }),
          inbound("m2", "800", { id: "producer_a", name: "Riverbend Sawmill" }),
          inbound("m1", "1250.5", { id: "producer_b", name: "Larch Hollow" }),
        ]}
      />,
    );

    const { stacked, table } = layouts();

    expect(stacked).toHaveLength(3);
    expect(table).toHaveLength(3);
    expect(stacked.map((row) => row.textContent)).toEqual([
      expect.stringContaining("Ridge Vault"),
      expect.stringContaining("Riverbend Sawmill"),
      expect.stringContaining("Larch Hollow"),
    ]);
    expect(table.map((row) => row.textContent)).toEqual([
      expect.stringContaining("Ridge Vault"),
      expect.stringContaining("Riverbend Sawmill"),
      expect.stringContaining("Larch Hollow"),
    ]);
  });

  it("renders an empty array as no rows rather than as anything else", () => {
    // The page decides which empty state belongs; this component only stops
    // rendering rows. Both empties are the page's job, not this one's.
    render(<MovementList movements={[]} />);

    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  it("says each direction in the yard's words", () => {
    render(
      <MovementList
        movements={[
          inbound("m1", "800", { id: "producer_a", name: "Riverbend Sawmill" }),
          outbound("m2", "250", { id: "site_y", name: "Ridge Vault" }),
        ]}
      />,
    );

    // Once in the stacked layout, once in the table — the same words Phase 5's
    // chooser and forms already use.
    expect(screen.getAllByText("Feedstock in")).toHaveLength(2);
    expect(screen.getAllByText("Feedstock out")).toHaveLength(2);
    expect(screen.queryByText("INBOUND")).not.toBeInTheDocument();
    expect(screen.queryByText("OUTBOUND")).not.toBeInTheDocument();
  });

  it("links an inbound counterparty to its producer page", () => {
    render(
      <MovementList
        movements={[
          inbound("m1", "800", { id: "producer_a", name: "Riverbend Sawmill" }),
        ]}
      />,
    );

    const links = screen.getAllByRole("link", { name: "Riverbend Sawmill" });

    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(link).toHaveAttribute("href", "/producers/producer_a");
    }
  });

  it("links an outbound counterparty to its sequestration site page", () => {
    render(
      <MovementList
        movements={[
          outbound("m1", "250", { id: "site_y", name: "Ridge Vault" }),
        ]}
      />,
    );

    const links = screen.getAllByRole("link", { name: "Ridge Vault" });

    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(link).toHaveAttribute("href", "/sites/site_y");
    }
  });

  it("marks an archived counterparty and still links it", () => {
    // specs/mission.md § Constraints keeps a movement's counterparty
    // resolvable for the life of the record, so an archived name is shown and
    // reachable — marked, so nobody reads it as one the entry forms offer.
    render(
      <MovementList
        movements={[
          inbound("m1", "2050.5", {
            id: "producer_c",
            name: "Alder Yard",
            isActive: false,
          }),
        ]}
      />,
    );

    expect(screen.getAllByRole("link", { name: "Alder Yard" })).toHaveLength(2);
    expect(screen.getAllByText("Archived")).toHaveLength(2);
  });

  it("leaves an active counterparty unmarked", () => {
    render(
      <MovementList
        movements={[
          inbound("m1", "800", { id: "producer_a", name: "Riverbend Sawmill" }),
        ]}
      />,
    );

    expect(screen.queryByText("Archived")).not.toBeInTheDocument();
  });

  it("renders weights grouped and unpadded, in kilograms", () => {
    render(
      <MovementList
        movements={[
          inbound("m1", "1250.500", {
            id: "producer_a",
            name: "Riverbend Sawmill",
          }),
          inbound("m2", "12345.001", {
            id: "producer_b",
            name: "Larch Hollow",
          }),
          inbound("m3", "800.000", { id: "producer_c", name: "Alder Yard" }),
        ]}
      />,
    );

    // Through formatWeightKg: thousands grouped, trailing zeros dropped, and
    // nothing rounded on its way to the page.
    expect(screen.getAllByText("1,250.5 kg")).toHaveLength(2);
    expect(screen.getAllByText("12,345.001 kg")).toHaveLength(2);
    expect(screen.getAllByText("800 kg")).toHaveLength(2);
  });

  it("renders each recorded time in UTC, labeled", () => {
    render(
      <MovementList
        movements={[
          inbound(
            "m1",
            "800",
            { id: "producer_a", name: "Riverbend Sawmill" },
            "2026-08-18T13:45:00.000Z",
          ),
        ]}
      />,
    );

    expect(screen.getAllByText("18 Aug 2026, 13:45 UTC")).toHaveLength(2);
  });

  it("offers no control that writes", () => {
    // Append-only — specs/mission.md § Constraints. A row action here would be
    // the one surface in v0.1 that could edit history.
    render(
      <MovementList
        movements={[
          inbound("m1", "800", { id: "producer_a", name: "Riverbend Sawmill" }),
        ]}
      />,
    );

    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});
