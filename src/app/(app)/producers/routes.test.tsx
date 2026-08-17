import { render, screen } from "@testing-library/react";
import { isValidElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReferenceForm } from "@/components/reference-form";

const findProducer = vi.fn();

vi.mock("@/lib/producer-queries", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/producer-queries")>()),
  findProducer: (id: string) => findProducer(id),
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

describe("the detail route", () => {
  beforeEach(() => {
    findProducer.mockReset();
    notFound.mockClear();
  });

  it("renders the producer's name", async () => {
    findProducer.mockResolvedValue({ id: "p1", name: "Cascade Timber Mill" });

    render(await ProducerPage({ params: Promise.resolve({ id: "p1" }) }));

    expect(
      screen.getByRole("heading", { name: "Cascade Timber Mill" }),
    ).toBeVisible();
  });

  it("offers Edit and Archive", async () => {
    findProducer.mockResolvedValue({ id: "p1", name: "Cascade Timber Mill" });

    render(await ProducerPage({ params: Promise.resolve({ id: "p1" }) }));

    expect(screen.getByRole("link", { name: /edit/i })).toHaveAttribute(
      "href",
      "/producers/p1/edit",
    );
    expect(screen.getByRole("button", { name: /archive/i })).toBeVisible();
  });

  it("is a 404 when no such producer exists", async () => {
    findProducer.mockResolvedValue(null);

    await expect(
      ProducerPage({ params: Promise.resolve({ id: "missing" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
