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

/*
 * `/producers` was a PlaceholderPage until Phase 3. These assert the swap
 * happened.
 *
 * The list this file used to carry — the destinations still behind a later
 * phase — is gone with the component itself. Phase 4 took `/sites` off it,
 * Phase 5 took `/record`, and Phase 6 took `/`, which was the last one;
 * `src/app/(app)/movements-page.test.tsx` asserts nothing imports
 * `PlaceholderPage` and that the file no longer exists.
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
