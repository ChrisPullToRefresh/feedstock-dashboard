import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const listActiveProducers = vi.fn();

vi.mock("@/lib/producer-queries", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/producer-queries")>()),
  listActiveProducers: () => listActiveProducers(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: vi.fn() }),
}));

const { default: ProducersPage } = await import("@/app/(app)/producers/page");
const { default: RecordPage } = await import("@/app/(app)/record/page");
const { default: MovementsPage } = await import("@/app/(app)/page");

/*
 * `/producers` was a PlaceholderPage until Phase 3. These assert the swap
 * happened and that it did not take the remaining placeholders with it.
 *
 * Phase 4 took `/sites` off this list, because it is a real page now —
 * `src/app/(app)/sites/list-page.test.tsx` asserts that. `/` and `/record`
 * stand behind Phases 6 and 5.
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
    { name: "/", Page: MovementsPage },
  ])("$name still renders its placeholder", ({ Page }) => {
    render(<Page />);

    expect(screen.getByText(/Arrives in Phase/i)).toBeVisible();
  });
});
