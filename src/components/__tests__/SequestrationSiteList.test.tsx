import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SequestrationSiteList } from "../SequestrationSiteList";
import type { SequestrationSite } from "@/lib/sequestrationSites";

describe("SequestrationSiteList", () => {
  it("renders a row per site", () => {
    const sites: SequestrationSite[] = [
      { id: 1, name: "Deep Well Site", created_at: "2026-07-01T00:00:00.000Z" },
      { id: 2, name: "Basalt Storage", created_at: "2026-07-02T00:00:00.000Z" },
    ];
    render(<SequestrationSiteList sites={sites} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("Deep Well Site")).toBeInTheDocument();
    expect(screen.getByText("Basalt Storage")).toBeInTheDocument();
  });

  it("renders an empty state when given no sites", () => {
    render(<SequestrationSiteList sites={[]} />);

    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(screen.getByText("No sequestration sites yet.")).toBeInTheDocument();
  });
});
