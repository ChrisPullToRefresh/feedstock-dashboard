import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { usePathname } = vi.hoisted(() => ({ usePathname: vi.fn(() => "/") }));

vi.mock("next/navigation", () => ({ usePathname }));

import { AppShell } from "@/components/app-shell";
import { NAV_DESTINATIONS } from "@/lib/navigation";

describe("AppShell", () => {
  beforeEach(() => {
    usePathname.mockReturnValue("/");
  });

  it("renders each navigation destination exactly once, with an accessible name", () => {
    render(
      <AppShell>
        <p>Facility</p>
      </AppShell>,
    );

    const nav = screen.getByRole("navigation", { name: "Main" });
    const links = within(nav).getAllByRole("link");

    expect(links).toHaveLength(NAV_DESTINATIONS.length);

    for (const { href, label } of NAV_DESTINATIONS) {
      const matches = within(nav).getAllByRole("link", { name: label });

      expect(matches).toHaveLength(1);
      expect(matches[0]).toHaveAttribute("href", href);
    }
  });

  it("marks only the destination matching the current path as current", () => {
    usePathname.mockReturnValue("/producers");

    render(
      <AppShell>
        <p>Facility</p>
      </AppShell>,
    );

    const nav = screen.getByRole("navigation", { name: "Main" });
    const current = within(nav)
      .getAllByRole("link")
      .filter((link) => link.getAttribute("aria-current") === "page");

    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAccessibleName("Producers");
  });

  it("points the skip link at the main region", () => {
    render(
      <AppShell>
        <p>Facility</p>
      </AppShell>,
    );

    // The mobile tab bar precedes the content in the DOM, so this link is the
    // only way past it with a keyboard. A renamed id would break it silently.
    const skipLink = screen.getByRole("link", { name: "Skip to content" });
    const target = screen.getByRole("main");

    expect(target.id).not.toBe("");
    expect(skipLink).toHaveAttribute("href", `#${target.id}`);
  });

  it("renders its children in the main region", () => {
    render(
      <AppShell>
        <p>Facility</p>
      </AppShell>,
    );

    expect(
      within(screen.getByRole("main")).getByText("Facility"),
    ).toBeVisible();
  });
});
