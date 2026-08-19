import { render, screen, within } from "@testing-library/react";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Prisma } from "@/generated/prisma/client";
import { Direction } from "@/generated/prisma/enums";
import type { CounterpartyFilterOption } from "@/lib/movement-data";
import type { ListedMovement } from "@/lib/movement-queries";
import type { MovementForTotals } from "@/lib/totals";

const listMovements = vi.fn();
const listMovementsForTotals = vi.fn();
const listProducersWithMovements = vi.fn();
const listSitesWithMovements = vi.fn();

vi.mock("@/lib/movement-queries", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/movement-queries")>()),
  listMovements: (...args: unknown[]) => listMovements(...args),
  listMovementsForTotals: (...args: unknown[]) =>
    listMovementsForTotals(...args),
  listProducersWithMovements: () => listProducersWithMovements(),
  listSitesWithMovements: () => listSitesWithMovements(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const MovementsPage = (await import("@/app/(app)/page")).default;

const PRODUCERS: CounterpartyFilterOption[] = [
  { id: "producer_a", name: "Riverbend Sawmill", isActive: true },
  { id: "producer_b", name: "Larch Hollow", isActive: true },
];

const SITES: CounterpartyFilterOption[] = [
  { id: "site_x", name: "Basin Store", isActive: true },
];

const listed = (id: string, weightKg: string): ListedMovement => ({
  id,
  direction: Direction.INBOUND,
  weightKg: new Prisma.Decimal(weightKg),
  recordedAt: new Date("2026-08-18T13:45:00.000Z"),
  producer: PRODUCERS[0]!,
  sequestrationSite: null,
});

const inboundTotal = (weightKg: string): MovementForTotals => ({
  direction: Direction.INBOUND,
  weightKg: new Prisma.Decimal(weightKg),
  producerId: "producer_a",
  sequestrationSiteId: null,
});

const outboundTotal = (weightKg: string): MovementForTotals => ({
  direction: Direction.OUTBOUND,
  weightKg: new Prisma.Decimal(weightKg),
  producerId: null,
  sequestrationSiteId: "site_x",
});

/** The running totals block, so a figure in it is never read off a breakdown. */
const totalsBlock = () =>
  within(screen.getByRole("region", { name: "Running totals" }));

/** What validation.md § Manual step 2 records, as the queries would return it. */
const THE_MANUAL_PASS = [
  inboundTotal("1250.5"),
  inboundTotal("800"),
  { ...inboundTotal("300"), producerId: "producer_b" },
  outboundTotal("900"),
  outboundTotal("250"),
];

async function renderPage(searchParams: Record<string, string> = {}) {
  render(await MovementsPage({ searchParams: Promise.resolve(searchParams) }));
}

beforeEach(() => {
  listMovements.mockReset().mockResolvedValue([listed("m1", "1250.5")]);
  listMovementsForTotals.mockReset().mockResolvedValue(THE_MANUAL_PASS);
  listProducersWithMovements.mockReset().mockResolvedValue(PRODUCERS);
  listSitesWithMovements.mockReset().mockResolvedValue(SITES);
});

describe("the movements page", () => {
  it("renders the filters, the totals, the table and both breakdowns", async () => {
    await renderPage();

    expect(screen.getByRole("combobox", { name: "Direction" })).toBeVisible();
    expect(totalsBlock().getByText("2,350.5 kg")).toBeVisible();
    expect(totalsBlock().getByText("1,150 kg")).toBeVisible();
    expect(
      screen.getAllByRole("link", { name: "Riverbend Sawmill" })[0],
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Inbound by producer" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Outbound by sequestration site" }),
    ).toBeVisible();
  });

  it("does not claim a filter is set when none is", async () => {
    // An empty breakdown on a bare `/` is not a filter matching nothing — a
    // facility whose movements are all outbound has an empty inbound one.
    listMovementsForTotals.mockResolvedValue([outboundTotal("900")]);

    await renderPage();

    expect(
      screen.getByText("No inbound movements in this view."),
    ).toBeVisible();
    expect(screen.queryByText(/match these filters/)).not.toBeInTheDocument();
  });

  it("renders the breakdowns heaviest first, from the totals query", async () => {
    await renderPage();

    const inbound = within(
      screen.getByRole("region", { name: "Inbound by producer" }),
    );

    // 2,050.5 from the first producer, 300 from the second.
    expect(inbound.getByText("2,050.5 kg")).toBeVisible();
    expect(inbound.getByText("300 kg")).toBeVisible();
    expect(
      inbound
        .getAllByRole("row")
        .filter((row) => within(row).queryAllByRole("cell").length > 0)
        .map((row) => row.textContent),
    ).toEqual([
      expect.stringContaining("Riverbend Sawmill"),
      expect.stringContaining("Larch Hollow"),
    ]);
  });

  it("passes the parsed filters to both queries", async () => {
    await renderPage({
      direction: Direction.INBOUND,
      producer: "producer_b",
      site: "site_x",
      limit: "2",
    });

    const expected = {
      direction: Direction.INBOUND,
      producerId: "producer_b",
      sequestrationSiteId: "site_x",
      limit: 2,
    };

    expect(listMovements).toHaveBeenCalledWith(expected);
    // The same filters to both, which is what keeps the table and the totals
    // describing one set of rows.
    expect(listMovementsForTotals).toHaveBeenCalledWith(expected);
  });

  it("treats an unrecognized parameter as unset rather than as an error", async () => {
    await renderPage({ direction: "sideways", producer: "producer_gone" });

    expect(listMovements).toHaveBeenCalledWith({
      direction: null,
      producerId: null,
      sequestrationSiteId: null,
      limit: 100,
    });
  });

  it("offers every counterparty that has movements in the dropdowns", async () => {
    await renderPage();

    expect(listProducersWithMovements).toHaveBeenCalled();
    expect(listSitesWithMovements).toHaveBeenCalled();
  });
});

describe("the page's two empty states", () => {
  it("explains the page and links to /record when nothing is recorded", async () => {
    listProducersWithMovements.mockResolvedValue([]);
    listSitesWithMovements.mockResolvedValue([]);
    listMovements.mockResolvedValue([]);
    listMovementsForTotals.mockResolvedValue([]);

    await renderPage();

    expect(screen.getByText("No movements yet")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Record a movement" }),
    ).toHaveAttribute("href", "/record");
    expect(screen.queryAllByRole("table")).toHaveLength(0);
    expect(
      screen.queryByRole("combobox", { name: "Direction" }),
    ).not.toBeInTheDocument();
  });

  it("offers Clear filters when the filters reach nothing", async () => {
    listMovements.mockResolvedValue([]);
    listMovementsForTotals.mockResolvedValue([]);

    await renderPage({ direction: Direction.OUTBOUND, producer: "producer_b" });

    expect(screen.getByText("No movements match these filters")).toBeVisible();
    expect(screen.queryByText("No movements yet")).not.toBeInTheDocument();
    // The filters stay, so the way out is reachable without a reload.
    expect(screen.getByRole("combobox", { name: "Direction" })).toBeVisible();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  it("says nothing here once, not three times over", async () => {
    listMovements.mockResolvedValue([]);
    listMovementsForTotals.mockResolvedValue([]);

    await renderPage({ direction: Direction.OUTBOUND, producer: "producer_b" });

    // The breakdowns would both be empty in this state too, so rendering them
    // beside the empty state stacks three "nothing here" messages on one
    // situation.
    expect(
      screen.queryByRole("region", { name: "Inbound by producer" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Outbound by sequestration site" }),
    ).not.toBeInTheDocument();
  });

  it("renders the table, not an empty state, when rows come back", async () => {
    await renderPage();

    expect(screen.queryByText("No movements yet")).not.toBeInTheDocument();
    expect(
      screen.queryByText("No movements match these filters"),
    ).not.toBeInTheDocument();
  });
});

describe("the page's cap", () => {
  const sixRows = [1, 2, 3, 4, 5, 6].map((n) => listed(`m${n}`, "100"));

  it("renders the limit's rows plus Show more when more came back", async () => {
    listMovements.mockResolvedValue(sixRows.slice(0, 3));

    await renderPage({ limit: "2" });

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Show more" })).toHaveAttribute(
      "href",
      "/?limit=102",
    );
    expect(totalsBlock().getByText("2,350.5 kg")).toBeVisible();
  });

  it("renders no control when exactly the limit came back", async () => {
    listMovements.mockResolvedValue(sixRows.slice(0, 2));

    await renderPage({ limit: "2" });

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(
      screen.queryByRole("link", { name: "Show more" }),
    ).not.toBeInTheDocument();
    // The same totals as the capped render above: they come from the other
    // query, so Show more does not move them.
    expect(totalsBlock().getByText("2,350.5 kg")).toBeVisible();
    expect(totalsBlock().getByText("1,150 kg")).toBeVisible();
  });
});

describe("what the placeholder left behind", () => {
  const pageSource = readFileSync(
    join(process.cwd(), "src/app/(app)/page.tsx"),
    "utf8",
  );

  /** Every source file under `src`, so nothing hides in a folder. */
  function sourceFiles(directory: string): string[] {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const path = join(directory, entry.name);

      if (entry.isDirectory()) return sourceFiles(path);

      return /\.tsx?$/.test(entry.name) ? [path] : [];
    });
  }

  it("renders per request rather than being prerendered", () => {
    // specs/2026-08-16-sequestration-sites/plan.md § Decisions binds this
    // forward to every page that reads the database. This one reads four
    // queries and its own search parameters.
    expect(pageSource).toMatch(/export const dynamic = "force-dynamic"/);
  });

  it("no longer has a placeholder component to import", () => {
    const files = sourceFiles(join(process.cwd(), "src"));

    expect(
      files.filter((path) => path.endsWith("placeholder-page.tsx")),
    ).toEqual([]);

    const importers = files.filter((path) =>
      /from "@\/components\/placeholder-page"/.test(readFileSync(path, "utf8")),
    );

    expect(importers).toEqual([]);
  });
});
