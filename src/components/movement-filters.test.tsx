import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MovementFilters } from "@/components/movement-filters";
import { Direction } from "@/generated/prisma/enums";
import {
  type MovementFilterOptions,
  type MovementFilters as Filters,
  NO_FILTERS,
} from "@/lib/movement-data";

const push = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const options: MovementFilterOptions = {
  producers: [
    { id: "producer_a", name: "Riverbend Sawmill", isActive: true },
    { id: "producer_c", name: "Alder Yard", isActive: false },
  ],
  sites: [{ id: "site_x", name: "Basin Store", isActive: true }],
};

/** Every filter set, so each assertion can prove the other two ride along. */
const ALL_SET: Filters = {
  direction: Direction.INBOUND,
  producerId: "producer_a",
  sequestrationSiteId: "site_x",
  limit: 300,
};

function renderFilters(filters: Filters = NO_FILTERS) {
  render(<MovementFilters filters={filters} options={options} />);

  return userEvent.setup();
}

/** Opens the named dropdown and picks an option out of it. */
async function choose(
  user: ReturnType<typeof userEvent.setup>,
  control: string,
  option: string | RegExp,
) {
  await user.click(screen.getByRole("combobox", { name: control }));
  await user.click(await screen.findByRole("option", { name: option }));
}

describe("the movement filters", () => {
  beforeEach(() => {
    push.mockReset();
  });

  it("offers all three controls", () => {
    renderFilters();

    expect(screen.getByRole("combobox", { name: "Direction" })).toBeVisible();
    expect(screen.getByRole("combobox", { name: "Producer" })).toBeVisible();
    expect(
      screen.getByRole("combobox", { name: "Sequestration site" }),
    ).toBeVisible();
  });

  it("shows nothing narrowed as nothing narrowed", () => {
    renderFilters();

    expect(
      screen.getByRole("combobox", { name: "Direction" }),
    ).toHaveTextContent("All directions");
    expect(
      screen.getByRole("combobox", { name: "Producer" }),
    ).toHaveTextContent("All producers");
  });

  it("navigates with the direction set and the other two preserved", async () => {
    const user = renderFilters({ ...ALL_SET, direction: null });

    await choose(user, "Direction", "Feedstock out");

    expect(push).toHaveBeenCalledWith(
      "/?direction=OUTBOUND&producer=producer_a&site=site_x",
    );
  });

  it("navigates with the producer set and the other two preserved", async () => {
    const user = renderFilters(ALL_SET);

    await choose(user, "Producer", /Alder Yard/);

    expect(push).toHaveBeenCalledWith(
      "/?direction=INBOUND&producer=producer_c&site=site_x",
    );
  });

  it("navigates with the sequestration site set and the other two preserved", async () => {
    const user = renderFilters({ ...ALL_SET, sequestrationSiteId: null });

    await choose(user, "Sequestration site", "Basin Store");

    expect(push).toHaveBeenCalledWith(
      "/?direction=INBOUND&producer=producer_a&site=site_x",
    );
  });

  it("drops the limit when a filter changes", async () => {
    // A new filter selects a different set of rows, so it starts over at the
    // newest hundred rather than carrying a raised limit across.
    const user = renderFilters(ALL_SET);

    await choose(user, "Direction", "Feedstock out");

    expect(push).toHaveBeenCalledWith(
      "/?direction=OUTBOUND&producer=producer_a&site=site_x",
    );
  });

  it("clears one filter back to all, leaving the others", async () => {
    const user = renderFilters(ALL_SET);

    await choose(user, "Producer", "All producers");

    expect(push).toHaveBeenCalledWith("/?direction=INBOUND&site=site_x");
  });

  it("marks an archived counterparty in the dropdown", async () => {
    // The filters follow the table: an archived producer's rows are still
    // there, so a filter has to be able to reach it — marked, so it is not
    // read as one the entry forms still offer.
    const user = renderFilters();

    await user.click(screen.getByRole("combobox", { name: "Producer" }));

    const archived = await screen.findByRole("option", { name: /Alder Yard/ });

    expect(archived).toHaveTextContent("Archived");
    expect(
      await screen.findByRole("option", { name: "Riverbend Sawmill" }),
    ).not.toHaveTextContent("Archived");
  });
});

describe("the Clear filters control", () => {
  beforeEach(() => {
    push.mockReset();
  });

  it("is absent with nothing narrowed", () => {
    // A control that clears nothing is a control that appears to do nothing.
    renderFilters();

    expect(screen.queryByText("Clear filters")).not.toBeInTheDocument();
  });

  it("is absent for a raised limit alone", () => {
    renderFilters({ ...NO_FILTERS, limit: 500 });

    expect(screen.queryByText("Clear filters")).not.toBeInTheDocument();
  });

  it.each([
    { direction: Direction.OUTBOUND },
    { producerId: "producer_a" },
    { sequestrationSiteId: "site_x" },
  ])("appears once %o is set, and goes to the bare path", (change) => {
    renderFilters({ ...NO_FILTERS, ...change });

    expect(screen.getByRole("link", { name: "Clear filters" })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
