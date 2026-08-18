import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listActiveProducers = vi.fn();
const listActiveSites = vi.fn();

vi.mock("@/lib/producer-queries", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/producer-queries")>()),
  listActiveProducers: () => listActiveProducers(),
}));

vi.mock("@/lib/site-queries", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/site-queries")>()),
  listActiveSites: () => listActiveSites(),
}));

const InboundRoute = await import("@/app/(app)/record/inbound/page");
const OutboundRoute = await import("@/app/(app)/record/outbound/page");

/**
 * The counterparty names on offer.
 *
 * Radix mirrors its Select into a hidden native `<select>` so the value
 * submits with the form, and that mirror carries an empty option for the
 * unchosen state — which is exactly what makes "nothing preselected" real on
 * submit. It is not a counterparty, so it is dropped here.
 */
function listedOptions(): (string | null)[] {
  return screen
    .getAllByRole("option", { hidden: true })
    .map((option) => option.textContent)
    .filter((text) => text !== "");
}

const routes = [
  {
    name: "feedstock in",
    Route: InboundRoute.default,
    module: InboundRoute,
    heading: "Feedstock in",
    label: "Producer",
    placeholder: "Select a producer",
    submitLabel: "Record feedstock in",
    query: listActiveProducers,
    otherQuery: listActiveSites,
    rows: [
      { id: "prd_1", name: "Aspen Ridge Timber" },
      { id: "prd_2", name: "Riverbend Sawmill" },
    ],
  },
  {
    name: "feedstock out",
    Route: OutboundRoute.default,
    module: OutboundRoute,
    heading: "Feedstock out",
    label: "Sequestration site",
    placeholder: "Select a sequestration site",
    submitLabel: "Record feedstock out",
    query: listActiveSites,
    otherQuery: listActiveProducers,
    rows: [
      { id: "sit_1", name: "Alkali Flat Storage" },
      { id: "sit_2", name: "Harney Basin Storage" },
    ],
  },
];

/*
 * Both routes render the same form; what differs is the direction, the word
 * above the dropdown, which table the options come from, and which action is
 * bound. A shared component makes those exactly the things easy to wire
 * backwards, so each is asserted per route.
 */
describe.each(routes)(
  "the $name route",
  ({
    Route,
    module,
    heading,
    label,
    placeholder,
    submitLabel,
    query,
    otherQuery,
    rows,
  }) => {
    beforeEach(() => {
      listActiveProducers.mockReset().mockResolvedValue([]);
      listActiveSites.mockReset().mockResolvedValue([]);
    });

    it("renders per request, never prerendered", () => {
      // A Server Component awaiting a query with no dynamic API is otherwise
      // static, and `next build` would bake the dropdown's contents into the
      // HTML — `specs/2026-08-16-sequestration-sites/plan.md` § Decisions.
      expect(module.dynamic).toBe("force-dynamic");
    });

    it("heads the page with this direction's words", async () => {
      query.mockResolvedValue(rows);

      render(await Route());

      expect(screen.getByRole("heading", { name: heading })).toBeVisible();
      expect(screen.getByText(label)).toBeVisible();
      expect(screen.getByText(placeholder)).toBeVisible();
      expect(screen.getByRole("button", { name: submitLabel })).toBeVisible();
      expect(screen.queryByText(/Arrives in Phase/i)).not.toBeInTheDocument();
    });

    it("reads its counterparties from its own query, not the other one", async () => {
      query.mockResolvedValue(rows);

      render(await Route());

      expect(query).toHaveBeenCalled();
      expect(otherQuery).not.toHaveBeenCalled();
    });

    it("offers exactly the rows the query returned", async () => {
      query.mockResolvedValue(rows);

      render(await Route());

      // The query is the thing that filters to active rows; this asserts the
      // route neither adds to nor drops from what it was handed.
      expect(listedOptions()).toEqual(rows.map((row) => row.name));
    });

    it("passes the counterparties down as id and name only", async () => {
      query.mockResolvedValue(
        rows.map((row) => ({
          ...row,
          isActive: true,
          createdAt: new Date("2026-08-17T00:00:00Z"),
          updatedAt: new Date("2026-08-17T00:00:00Z"),
        })),
      );

      // Dates in a client component's props are payload it never displays.
      // Rendering is enough to prove the narrowing: an unserializable prop
      // would fail the build, not this test, so what is asserted here is that
      // the rows still arrive intact after being narrowed.
      render(await Route());

      expect(listedOptions()).toEqual(rows.map((row) => row.name));
    });
  },
);
