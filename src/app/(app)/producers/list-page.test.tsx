import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const listActiveProducers = vi.fn();

vi.mock("@/lib/producers", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/producers")>()),
  listActiveProducers: () => listActiveProducers(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: vi.fn() }),
}));

const { default: ProducersPage } = await import("@/app/(app)/producers/page");
const { default: RecordPage } = await import("@/app/(app)/record/page");
const { default: SitesPage } = await import("@/app/(app)/sites/page");

/*
 * `/producers` was a PlaceholderPage until this phase. These assert the swap
 * happened and that it did not take the other two placeholders with it —
 * Phases 4 and 5 still stand behind them.
 */
describe("the producers route", () => {
  it("renders the real list, not the placeholder", async () => {
    listActiveProducers.mockResolvedValue([
      { id: "p1", name: "Cascade Timber Mill" },
    ]);

    render(await ProducersPage());

    expect(
      screen.getAllByRole("link", { name: "Cascade Timber Mill" })[0],
    ).toBeVisible();
    expect(screen.queryByText(/Arrives in Phase/i)).not.toBeInTheDocument();
  });

  it("reads the producers from the query, not from the component", async () => {
    listActiveProducers.mockResolvedValue([]);

    render(await ProducersPage());

    expect(listActiveProducers).toHaveBeenCalled();
    expect(screen.getByText("No producers yet")).toBeVisible();
  });
});

describe("the routes still waiting on later phases", () => {
  it.each([
    { name: "/record", Page: RecordPage },
    { name: "/sites", Page: SitesPage },
  ])("$name still renders its placeholder", ({ Page }) => {
    render(<Page />);

    expect(screen.getByText(/Arrives in Phase/i)).toBeVisible();
  });
});
