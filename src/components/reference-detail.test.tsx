import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

import { ReferenceDetail } from "@/components/reference-detail";
import { Prisma } from "@/generated/prisma/client";
import { Direction } from "@/generated/prisma/enums";
import type { ListedMovement } from "@/lib/movement-queries";

/*
 * One component behind two pages, so every assertion runs for both entities.
 * The five things that differ — the description, the edit path, the archive
 * words, the confirm label and the See all filter — are exactly what these
 * cases vary.
 */

const movement = (
  direction: Direction,
  weightKg: string,
  counterparty: { id: string; name: string },
): ListedMovement => ({
  id: `m-${counterparty.id}-${weightKg}`,
  direction,
  weightKg: new Prisma.Decimal(weightKg),
  recordedAt: new Date("2026-08-18T13:45:00.000Z"),
  producer:
    direction === Direction.INBOUND
      ? { ...counterparty, isActive: true }
      : null,
  sequestrationSite:
    direction === Direction.OUTBOUND
      ? { ...counterparty, isActive: true }
      : null,
});

const PRODUCER = {
  entity: "a producer",
  props: {
    name: "Riverbend Sawmill",
    description:
      "Inbound movements record the feedstock that came from this producer.",
    editPath: "/producers/producer_a/edit",
    archiveDescription:
      "It stops appearing in the producers list and in the inbound movement dropdown.",
    confirmLabel: "Archive producer",
    totalLabel: "Total inbound",
    seeAllHref: "/?producer=producer_a",
    noMovementsMessage:
      "No feedstock has been recorded from this producer yet.",
  },
  movementWeightLabel: "1,250.5 kg",
  movements: [
    movement(Direction.INBOUND, "1250.5", {
      id: "producer_a",
      name: "Riverbend Sawmill",
    }),
  ],
};

const SITE = {
  entity: "a sequestration site",
  props: {
    name: "Basalt Ridge",
    description:
      "Outbound movements record the processed feedstock that went to this sequestration site.",
    editPath: "/sites/site_x/edit",
    archiveDescription:
      "It stops appearing in the sequestration sites list and in the outbound movement dropdown.",
    confirmLabel: "Archive sequestration site",
    totalLabel: "Total outbound",
    seeAllHref: "/?site=site_x",
    noMovementsMessage: "No feedstock has been recorded to this site yet.",
  },
  movementWeightLabel: "900 kg",
  movements: [
    movement(Direction.OUTBOUND, "900", { id: "site_x", name: "Basalt Ridge" }),
  ],
};

function renderDetail(
  fixture: typeof PRODUCER,
  override: { movements?: ListedMovement[]; totalKg?: string } = {},
) {
  const archive = vi.fn(async () => {});

  render(
    <ReferenceDetail
      {...fixture.props}
      archive={archive}
      totalKg={new Prisma.Decimal(override.totalKg ?? "7777")}
      movements={override.movements ?? fixture.movements}
    />,
  );

  return archive;
}

describe.each([PRODUCER, SITE])("the detail page for $entity", (fixture) => {
  it("renders the name and this entity's own description", () => {
    renderDetail(fixture);

    expect(
      screen.getByRole("heading", { name: fixture.props.name, level: 1 }),
    ).toBeVisible();
    expect(screen.getByText(fixture.props.description)).toBeVisible();
  });

  it("links Edit to this entity's edit path", () => {
    renderDetail(fixture);

    expect(screen.getByRole("link", { name: /edit/i })).toHaveAttribute(
      "href",
      fixture.props.editPath,
    );
  });

  it("uses this entity's words in the archive dialog", async () => {
    const user = userEvent.setup();

    renderDetail(fixture);
    await user.click(screen.getByRole("button", { name: "Archive" }));

    expect(
      await screen.findByText(fixture.props.archiveDescription),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: fixture.props.confirmLabel }),
    ).toBeVisible();
  });

  it("renders the counterparty's total, formatted", () => {
    renderDetail(fixture, { totalKg: "2050.500" });

    expect(screen.getByText(fixture.props.totalLabel)).toBeVisible();
    // Grouped, unpadded, exact — the same formatting as everywhere else.
    expect(screen.getByText("2,050.5 kg")).toBeVisible();
  });

  it("keeps the total exact to the gram", () => {
    renderDetail(fixture, { totalKg: "1250.501" });

    expect(screen.getByText("1,250.501 kg")).toBeVisible();
  });

  it("lists the recent movements through the shared movement list", () => {
    renderDetail(fixture);

    // Both layouts render, so each row appears twice — the movement list's
    // own behavior, reached from here. The total is a different figure, so a
    // row's weight cannot be mistaken for it.
    expect(screen.getAllByText(fixture.movementWeightLabel)).toHaveLength(2);
    expect(screen.getAllByText("18 Aug 2026, 13:45 UTC")).toHaveLength(2);
    expect(screen.getByText("7,777 kg")).toBeVisible();
  });

  it("links See all to the movement list filtered to this counterparty", () => {
    renderDetail(fixture);

    expect(screen.getByRole("link", { name: "See all" })).toHaveAttribute(
      "href",
      fixture.props.seeAllHref,
    );
  });

  it("explains an empty history rather than rendering an empty table", () => {
    renderDetail(fixture, { movements: [] });

    expect(screen.getByText(fixture.props.noMovementsMessage)).toBeVisible();
    expect(screen.queryAllByRole("table")).toHaveLength(0);
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  it("still offers See all with no movements", () => {
    // The link is unconditional: the counterparty's whole history lives on the
    // movement list, and an empty filtered list is a legible answer.
    renderDetail(fixture, { movements: [] });

    expect(screen.getByRole("link", { name: "See all" })).toBeVisible();
  });

  it("offers no control that edits a movement", () => {
    renderDetail(fixture);

    // Edit here is the counterparty's name; Archive is the counterparty.
    // Neither touches a movement — specs/mission.md § Constraints.
    expect(
      screen.getAllByRole("button").map((button) => button.textContent),
    ).toEqual(["Archive"]);
  });
});

describe("the two pages side by side", () => {
  const routeSource = (entity: string) =>
    readFileSync(
      join(process.cwd(), `src/app/(app)/${entity}/[id]/page.tsx`),
      "utf8",
    );

  it("leaves neither route duplicating the other's markup", () => {
    // The extraction is only real if the routes stopped carrying the page.
    // Each renders one element and nothing else — no heading, no buttons, no
    // archive dialog of its own.
    for (const entity of ["producers", "sites"]) {
      const source = routeSource(entity);

      expect(source).toContain("<ReferenceDetail");
      for (const markup of [
        "<h1",
        "<h2",
        "<Button",
        "<ArchiveDialog",
        "<Link",
      ]) {
        expect(source).not.toContain(markup);
      }
    }
  });

  it("takes every difference from props, not from a branch inside", () => {
    // The extraction's whole point: the words that differ arrive as props, so
    // neither page can drift from the other's structure.
    expect(Object.keys(PRODUCER.props).sort()).toEqual(
      Object.keys(SITE.props).sort(),
    );
    expect(PRODUCER.props.description).not.toBe(SITE.props.description);
    expect(PRODUCER.props.confirmLabel).not.toBe(SITE.props.confirmLabel);
    expect(PRODUCER.props.seeAllHref).not.toBe(SITE.props.seeAllHref);
  });
});
