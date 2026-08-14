import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProducerList } from "@/components/producer-list";

/*
 * The list renders twice — stacked rows for the phone, a table for desktop —
 * because `specs/tech-stack.md` widens the mobile design rather than building
 * a second one. Both are in the DOM at once and CSS chooses; these assertions
 * therefore expect two of everything, which is the honest reading.
 */
const producers = [
  { id: "p2", name: "Blue Mountain Forestry" },
  { id: "p1", name: "Aspen Ridge Timber" },
  { id: "p3", name: "Cascade Timber Mill" },
];

describe("the producers list", () => {
  it("renders every producer", () => {
    render(<ProducerList producers={producers} />);

    for (const producer of producers) {
      expect(screen.getAllByRole("link", { name: producer.name })).toHaveLength(
        2,
      );
    }
  });

  it("renders producers in the order given, which the query sorts by name", () => {
    // The component does not sort. `listActiveProducers` orders by name, and
    // re-sorting here would hide it silently changing.
    const sorted = [...producers].sort((a, b) => a.name.localeCompare(b.name));
    render(<ProducerList producers={sorted} />);

    const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1);

    expect(rows.map((row) => row.textContent)).toEqual([
      "Aspen Ridge Timber",
      "Blue Mountain Forestry",
      "Cascade Timber Mill",
    ]);
  });

  it("links each producer to its detail page", () => {
    render(<ProducerList producers={producers} />);

    for (const link of screen.getAllByRole("link", {
      name: "Aspen Ridge Timber",
    })) {
      expect(link).toHaveAttribute("href", "/producers/p1");
    }
  });

  it("does not render a producer it was not given", () => {
    // Archiving is what removes a producer from this list, and it does so by
    // never reaching the component — `listActiveProducers` filters on isActive.
    render(<ProducerList producers={producers} />);

    expect(screen.queryByText("Larch Hollow")).not.toBeInTheDocument();
  });

  it("offers both layouts, so the phone is not given a table to scroll", () => {
    render(<ProducerList producers={producers} />);

    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
  });
});

describe("the producers list with nothing in it", () => {
  it("explains what producers are for", () => {
    render(<ProducerList producers={[]} />);

    expect(screen.getByText("No producers yet")).toBeVisible();
    expect(screen.getByText(/inbound movements come from/i)).toBeVisible();
  });

  it("links to the create form", () => {
    render(<ProducerList producers={[]} />);

    expect(
      screen.getByRole("link", { name: "Add the first producer" }),
    ).toHaveAttribute("href", "/producers/new");
  });

  it("renders neither layout", () => {
    render(<ProducerList producers={[]} />);

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
