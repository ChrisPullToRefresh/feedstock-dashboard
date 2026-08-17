import { render, screen, within } from "@testing-library/react";
import { Factory, Warehouse } from "lucide-react";
import { describe, expect, it } from "vitest";

import {
  ReferenceList,
  ReferenceListHeader,
} from "@/components/reference-list";

/*
 * The list renders twice — stacked rows for the phone, a table for desktop —
 * because `specs/tech-stack.md` widens the mobile design rather than building
 * a second one. Both are in the DOM at once and CSS chooses; these assertions
 * therefore expect two of everything, which is the honest reading.
 *
 * Every case runs at both entities. The list is shared as of Phase 4, so the
 * site copy and the site paths are proven here rather than only by hand.
 */
const entities = [
  {
    entity: "producers",
    basePath: "/producers",
    createPath: "/producers/new",
    heading: "Producers",
    createLabel: "Add producer",
    emptyIcon: Factory,
    emptyTitle: "No producers yet",
    emptyDescription:
      "Feedstock producers are who inbound movements come from. Add one and it becomes available when recording an inbound movement.",
    emptyActionLabel: "Add the first producer",
    emptyClue: /inbound movements come from/i,
    items: [
      { id: "r2", name: "Blue Mountain Forestry" },
      { id: "r1", name: "Aspen Ridge Timber" },
      { id: "r3", name: "Cascade Timber Mill" },
    ],
    absent: "Larch Hollow",
  },
  {
    entity: "sequestration sites",
    basePath: "/sites",
    createPath: "/sites/new",
    heading: "Sequestration sites",
    createLabel: "Add sequestration site",
    emptyIcon: Warehouse,
    emptyTitle: "No sequestration sites yet",
    emptyDescription:
      "Sequestration sites are where outbound movements go. Add one and it becomes available when recording an outbound movement.",
    emptyActionLabel: "Add the first sequestration site",
    emptyClue: /outbound movements go/i,
    items: [
      { id: "r2", name: "Basalt Ridge Injection Site" },
      { id: "r1", name: "Alkali Flat Storage" },
      { id: "r3", name: "Harney Basin Storage" },
    ],
    absent: "Steens Basin",
  },
];

describe.each(entities)("the $entity list", (entity) => {
  const { items, basePath, absent } = entity;

  function renderList(rows = items) {
    render(
      <ReferenceList
        items={rows}
        basePath={basePath}
        createPath={entity.createPath}
        emptyIcon={entity.emptyIcon}
        emptyTitle={entity.emptyTitle}
        emptyDescription={entity.emptyDescription}
        emptyActionLabel={entity.emptyActionLabel}
      />,
    );
  }

  it("renders every row", () => {
    renderList();

    for (const item of items) {
      expect(screen.getAllByRole("link", { name: item.name })).toHaveLength(2);
    }
  });

  it("renders rows in the order given, which the query sorts by name", () => {
    // The component does not sort. The list query orders by name, and
    // re-sorting here would hide it silently changing.
    const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));
    renderList(sorted);

    const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1);

    expect(rows.map((row) => row.textContent)).toEqual(
      sorted.map((item) => item.name),
    );
  });

  it("links each row to its detail page", () => {
    renderList();

    const first = items.find((item) => item.id === "r1");

    for (const link of screen.getAllByRole("link", { name: first!.name })) {
      expect(link).toHaveAttribute("href", `${basePath}/r1`);
    }
  });

  it("does not render a row it was not given", () => {
    // Archiving is what removes a row from this list, and it does so by never
    // reaching the component — the list query filters on isActive.
    renderList();

    expect(screen.queryByText(absent)).not.toBeInTheDocument();
  });

  it("offers both layouts, so the phone is not given a table to scroll", () => {
    renderList();

    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
  });
});

describe.each(entities)("the $entity list with nothing in it", (entity) => {
  function renderEmpty() {
    render(
      <ReferenceList
        items={[]}
        basePath={entity.basePath}
        createPath={entity.createPath}
        emptyIcon={entity.emptyIcon}
        emptyTitle={entity.emptyTitle}
        emptyDescription={entity.emptyDescription}
        emptyActionLabel={entity.emptyActionLabel}
      />,
    );
  }

  it("explains what they are for", () => {
    renderEmpty();

    expect(screen.getByText(entity.emptyTitle)).toBeVisible();
    expect(screen.getByText(entity.emptyClue)).toBeVisible();
  });

  it("links to the create form", () => {
    renderEmpty();

    expect(
      screen.getByRole("link", { name: entity.emptyActionLabel }),
    ).toHaveAttribute("href", entity.createPath);
  });

  it("renders neither layout", () => {
    renderEmpty();

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});

describe.each(entities)("the $entity list header", (entity) => {
  it("heads the page and links to the create form", () => {
    render(
      <ReferenceListHeader
        heading={entity.heading}
        createPath={entity.createPath}
        createLabel={entity.createLabel}
      />,
    );

    expect(screen.getByRole("heading", { name: entity.heading })).toBeVisible();
    expect(
      screen.getByRole("link", { name: entity.createLabel }),
    ).toHaveAttribute("href", entity.createPath);
  });
});
