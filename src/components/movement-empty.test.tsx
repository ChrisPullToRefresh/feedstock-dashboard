import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NoMovementsMatch, NoMovementsYet } from "@/components/movement-empty";

/*
 * Two empty states, not one. Someone who has filtered into a corner must not
 * be told the facility has no movements — it is false, and it offers no way
 * back.
 */

describe("with no movements at all", () => {
  it("explains the page and links to /record", () => {
    render(<NoMovementsYet />);

    expect(screen.getByText("No movements yet")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Record a movement" }),
    ).toHaveAttribute("href", "/record");
  });

  it("offers no way to clear filters, because none are set", () => {
    render(<NoMovementsYet />);

    expect(screen.queryByText("Clear filters")).not.toBeInTheDocument();
  });

  it("renders no table", () => {
    render(<NoMovementsYet />);

    expect(screen.queryAllByRole("table")).toHaveLength(0);
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });
});

describe("with filters that match nothing", () => {
  it("says so, and offers Clear filters", () => {
    render(<NoMovementsMatch />);

    expect(screen.getByText("No movements match these filters")).toBeVisible();
    expect(screen.getByRole("link", { name: "Clear filters" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("does not claim the facility has no movements", () => {
    // The false statement this second state exists to avoid.
    render(<NoMovementsMatch />);

    expect(screen.queryByText("No movements yet")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Record a movement" }),
    ).not.toBeInTheDocument();
  });

  it("renders no table", () => {
    render(<NoMovementsMatch />);

    expect(screen.queryAllByRole("table")).toHaveLength(0);
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });
});
