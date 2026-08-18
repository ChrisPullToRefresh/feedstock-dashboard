import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const listActiveSites = vi.fn();

vi.mock("@/lib/site-queries", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/site-queries")>()),
  listActiveSites: () => listActiveSites(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: vi.fn() }),
}));

const { default: SitesPage } = await import("@/app/(app)/sites/page");

/*
 * `/sites` was a PlaceholderPage until Phase 4. These assert the swap
 * happened. Phase 6 took the last placeholder — `/` — and deleted the
 * component with it; `src/app/(app)/movements-page.test.tsx` asserts that.
 */
describe("the sites route", () => {
  it("renders the real list, not the placeholder", async () => {
    listActiveSites.mockResolvedValue([
      { id: "s1", name: "Basalt Ridge Injection Site" },
    ]);

    render(await SitesPage());

    expect(
      screen.getAllByRole("link", { name: "Basalt Ridge Injection Site" })[0],
    ).toBeVisible();
    expect(screen.queryByText(/Arrives in Phase/i)).not.toBeInTheDocument();
  });

  it("reads the sites from the query, not from the component", async () => {
    listActiveSites.mockResolvedValue([]);

    render(await SitesPage());

    expect(listActiveSites).toHaveBeenCalled();
    expect(screen.getByText("No sequestration sites yet")).toBeVisible();
  });

  it("heads the page with the term the mission uses, not the nav label", async () => {
    // The route and the nav label stay "Sites"; the words on the screen are
    // "sequestration site" — `plan.md` § Decisions.
    listActiveSites.mockResolvedValue([]);

    render(await SitesPage());

    expect(
      screen.getByRole("heading", { name: "Sequestration sites" }),
    ).toBeVisible();
  });
});
