import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProducerList } from "../ProducerList";
import type { Producer } from "@/lib/producers";

describe("ProducerList", () => {
  it("renders a row per producer", () => {
    const producers: Producer[] = [
      { id: 1, name: "Acme Farms", created_at: "2026-07-01T00:00:00.000Z" },
      { id: 2, name: "Green Co", created_at: "2026-07-02T00:00:00.000Z" },
    ];
    render(<ProducerList producers={producers} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("Acme Farms")).toBeInTheDocument();
    expect(screen.getByText("Green Co")).toBeInTheDocument();
  });

  it("renders an empty state when given no producers", () => {
    render(<ProducerList producers={[]} />);

    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(screen.getByText("No producers yet.")).toBeInTheDocument();
  });
});
