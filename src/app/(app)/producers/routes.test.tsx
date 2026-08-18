import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { isValidElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReferenceForm } from "@/components/reference-form";
import { Prisma } from "@/generated/prisma/client";
import { Direction } from "@/generated/prisma/enums";
import type { MovementForTotals } from "@/lib/totals";

/** A row the totals read, as the counterparty query would return it. */
const inboundRow = (weightKg: string): MovementForTotals => ({
  direction: Direction.INBOUND,
  weightKg: new Prisma.Decimal(weightKg),
  producerId: "p1",
  sequestrationSiteId: null,
});

const findProducer = vi.fn();

vi.mock("@/lib/producer-queries", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/producer-queries")>()),
  findProducer: (id: string) => findProducer(id),
}));

const listRecentMovementsFor = vi.fn();
const listMovementsForCounterpartyTotals = vi.fn();

vi.mock("@/lib/movement-queries", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/movement-queries")>()),
  listRecentMovementsFor: (...args: unknown[]) =>
    listRecentMovementsFor(...args),
  listMovementsForCounterpartyTotals: (...args: unknown[]) =>
    listMovementsForCounterpartyTotals(...args),
}));

const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("next/navigation", () => ({ notFound: () => notFound() }));

const { default: NewProducerPage } =
  await import("@/app/(app)/producers/new/page");
const { default: EditProducerPage } =
  await import("@/app/(app)/producers/[id]/edit/page");
const { createProducer, restoreProducer } =
  await import("@/app/(app)/producers/actions");

/** The ReferenceForm element a route returned, wherever it sits in the tree. */
function findForm(node: ReactNode): Record<string, unknown> | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findForm(child);
      if (found) return found;
    }
    return null;
  }

  if (!isValidElement(node)) return null;
  if (node.type === ReferenceForm) return node.props as Record<string, unknown>;

  return findForm((node.props as { children?: ReactNode }).children);
}

/*
 * Both routes render the same form; what differs is which action it is bound
 * to and whether the field arrives filled. These render the Server Components
 * directly, which is what they are — awaiting the element they return.
 */
describe("the create route", () => {
  it("renders the form with an empty name", () => {
    render(<NewProducerPage />);

    expect(screen.getByLabelText("Name")).toHaveValue("");
    expect(
      screen.getByRole("button", { name: "Create producer" }),
    ).toBeVisible();
  });

  it("hands the form both the create action and the restore path", () => {
    // The mirror of the same assertion on /sites/new. The restore offer is the
    // only route back to an archived producer, and the form's own tests supply
    // a stub restore action, so a route that dropped the prop would pass
    // everything and fail first in front of a person.
    const props = findForm(NewProducerPage());

    expect(props?.action).toBe(createProducer);
    expect(props?.restore).toBe(restoreProducer);
  });
});

describe("the edit route", () => {
  beforeEach(() => {
    findProducer.mockReset();
    notFound.mockClear();
  });

  it("renders the form with the producer's current name", async () => {
    findProducer.mockResolvedValue({ id: "p1", name: "Riverbend Sawmill" });

    render(await EditProducerPage({ params: Promise.resolve({ id: "p1" }) }));

    expect(screen.getByLabelText("Name")).toHaveValue("Riverbend Sawmill");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeVisible();
  });

  it("looks the producer up by the id in the route", async () => {
    findProducer.mockResolvedValue({ id: "p9", name: "Larch Hollow" });

    render(await EditProducerPage({ params: Promise.resolve({ id: "p9" }) }));

    expect(findProducer).toHaveBeenCalledWith("p9");
  });

  it("is a 404 when no such producer exists", async () => {
    findProducer.mockResolvedValue(null);

    await expect(
      EditProducerPage({ params: Promise.resolve({ id: "missing" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });
});

const { default: ProducerPage } =
  await import("@/app/(app)/producers/[id]/page");

/*
 * Phase 6 made this route thin: it keeps its own query, its own notFound, its
 * own archive action and its own words, and renders them through the shared
 * ReferenceDetail. What follows asserts the words are this entity's, and
 * `src/components/reference-detail.test.tsx` asserts the structure they land
 * in.
 */
describe("the detail route", () => {
  beforeEach(() => {
    findProducer.mockReset();
    notFound.mockClear();
    listRecentMovementsFor.mockReset().mockResolvedValue([]);
    listMovementsForCounterpartyTotals
      .mockReset()
      .mockResolvedValue([inboundRow("2050.5"), inboundRow("300")]);
  });

  const renderPage = async (id = "p1") => {
    findProducer.mockResolvedValue({ id, name: "Cascade Timber Mill" });

    render(await ProducerPage({ params: Promise.resolve({ id }) }));
  };

  it("renders the producer's name", async () => {
    await renderPage();

    expect(
      screen.getByRole("heading", { name: "Cascade Timber Mill" }),
    ).toBeVisible();
  });

  it("offers Edit and Archive", async () => {
    await renderPage();

    expect(screen.getByRole("link", { name: /edit/i })).toHaveAttribute(
      "href",
      "/producers/p1/edit",
    );
    expect(screen.getByRole("button", { name: /archive/i })).toBeVisible();
  });

  it("uses the producer's own description and confirm label", async () => {
    const user = userEvent.setup();

    await renderPage();

    expect(
      screen.getByText(
        "Inbound movements record the feedstock that came from this producer.",
      ),
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Archive" }));

    expect(
      await screen.findByRole("button", { name: "Archive producer" }),
    ).toBeVisible();
    expect(
      screen.getByText(/stops appearing in the producers list/),
    ).toBeVisible();
  });

  it("reads this producer's movements and totals, keyed inbound", async () => {
    await renderPage("p9");

    expect(listRecentMovementsFor).toHaveBeenCalledWith(
      Direction.INBOUND,
      "p9",
    );
    expect(listMovementsForCounterpartyTotals).toHaveBeenCalledWith(
      Direction.INBOUND,
      "p9",
    );
  });

  it("renders the producer's total inbound weight", async () => {
    await renderPage();

    expect(screen.getByText("Total inbound")).toBeVisible();
    expect(screen.getByText("2,350.5 kg")).toBeVisible();
  });

  it("links See all to the movement list filtered to this producer", async () => {
    await renderPage("p9");

    expect(screen.getByRole("link", { name: "See all" })).toHaveAttribute(
      "href",
      "/?producer=p9",
    );
  });

  it("is a 404 when no such producer exists", async () => {
    findProducer.mockResolvedValue(null);

    await expect(
      ProducerPage({ params: Promise.resolve({ id: "missing" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
