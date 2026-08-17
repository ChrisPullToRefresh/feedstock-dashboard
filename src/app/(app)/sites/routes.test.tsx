import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const findSite = vi.fn();

vi.mock("@/lib/site-queries", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/site-queries")>()),
  findSite: (id: string) => findSite(id),
}));

const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("next/navigation", () => ({ notFound: () => notFound() }));

const { default: NewSitePage } = await import("@/app/(app)/sites/new/page");
const { default: EditSitePage } =
  await import("@/app/(app)/sites/[id]/edit/page");

/*
 * Both routes render the same form; what differs is which action it is bound
 * to and whether the field arrives filled. These render the Server Components
 * directly, which is what they are — awaiting the element they return.
 */
describe("the create route", () => {
  it("renders the form with an empty name", () => {
    render(<NewSitePage />);

    expect(screen.getByLabelText("Name")).toHaveValue("");
    expect(
      screen.getByRole("button", { name: "Create sequestration site" }),
    ).toBeVisible();
  });
});

describe("the edit route", () => {
  beforeEach(() => {
    findSite.mockReset();
    notFound.mockClear();
  });

  it("renders the form with the site's current name", async () => {
    findSite.mockResolvedValue({ id: "s1", name: "Harney Basin Storage" });

    render(await EditSitePage({ params: Promise.resolve({ id: "s1" }) }));

    expect(screen.getByLabelText("Name")).toHaveValue("Harney Basin Storage");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeVisible();
  });

  it("looks the site up by the id in the route", async () => {
    findSite.mockResolvedValue({ id: "s9", name: "Steens Basin" });

    render(await EditSitePage({ params: Promise.resolve({ id: "s9" }) }));

    expect(findSite).toHaveBeenCalledWith("s9");
  });

  it("is a 404 when no such site exists", async () => {
    findSite.mockResolvedValue(null);

    await expect(
      EditSitePage({ params: Promise.resolve({ id: "missing" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });
});

const { default: SitePage } = await import("@/app/(app)/sites/[id]/page");

describe("the detail route", () => {
  beforeEach(() => {
    findSite.mockReset();
    notFound.mockClear();
  });

  it("renders the site's name", async () => {
    findSite.mockResolvedValue({
      id: "s1",
      name: "Basalt Ridge Injection Site",
    });

    render(await SitePage({ params: Promise.resolve({ id: "s1" }) }));

    expect(
      screen.getByRole("heading", { name: "Basalt Ridge Injection Site" }),
    ).toBeVisible();
  });

  it("offers Edit and Archive", async () => {
    findSite.mockResolvedValue({
      id: "s1",
      name: "Basalt Ridge Injection Site",
    });

    render(await SitePage({ params: Promise.resolve({ id: "s1" }) }));

    expect(screen.getByRole("link", { name: /edit/i })).toHaveAttribute(
      "href",
      "/sites/s1/edit",
    );
    expect(screen.getByRole("button", { name: /archive/i })).toBeVisible();
  });

  it("is a 404 when no such site exists", async () => {
    findSite.mockResolvedValue(null);

    await expect(
      SitePage({ params: Promise.resolve({ id: "missing" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
