import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Shell } from "../Shell";

vi.mock("@clerk/nextjs", () => ({
  UserButton: () => <button type="button">Account</button>,
}));

describe("Shell", () => {
  it("renders the header, nav, and main landmarks with the app brand", () => {
    render(
      <Shell>
        <p>Content</p>
      </Shell>
    );

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
    expect(screen.getByText("Feedstock Dashboard")).toBeInTheDocument();

    const main = screen.getByRole("main");
    expect(main).toBeInTheDocument();
    expect(main).toHaveTextContent("Content");
  });

  it("renders a nav toggle button and all five destination links, correctly href-ed", () => {
    render(
      <Shell>
        <p>Content</p>
      </Shell>
    );

    expect(
      screen.getByRole("button", { name: "Open menu" })
    ).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Producers" })).toHaveAttribute(
      "href",
      "/producers"
    );
    expect(
      screen.getByRole("link", { name: "Sequestration sites" })
    ).toHaveAttribute("href", "/sites");
    expect(screen.getByRole("link", { name: "Transactions" })).toHaveAttribute(
      "href",
      "/transactions"
    );
    expect(
      screen.getByRole("link", { name: "Record incoming" })
    ).toHaveAttribute("href", "/transactions/new/in");
    expect(
      screen.getByRole("link", { name: "Record outgoing" })
    ).toHaveAttribute("href", "/transactions/new/out");
  });

  it("toggles the nav menu open and closed via the toggle button", () => {
    render(
      <Shell>
        <p>Content</p>
      </Shell>
    );

    const toggle = screen.getByRole("button", { name: "Open menu" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggle);
    const closeToggle = screen.getByRole("button", { name: "Close menu" });
    expect(closeToggle).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(closeToggle);
    expect(screen.getByRole("button", { name: "Open menu" })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });

  it("closes the menu after a nav link is clicked", () => {
    render(
      <Shell>
        <p>Content</p>
      </Shell>
    );

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    fireEvent.click(screen.getByRole("link", { name: "Producers" }));

    expect(
      screen.getByRole("button", { name: "Open menu" })
    ).toBeInTheDocument();
  });

  it("applies responsive layout classes to the header and main landmarks", () => {
    render(
      <Shell>
        <p>Content</p>
      </Shell>
    );

    expect(screen.getByRole("banner").className).toBeTruthy();
    expect(screen.getByRole("main").className).toBeTruthy();
  });
});
