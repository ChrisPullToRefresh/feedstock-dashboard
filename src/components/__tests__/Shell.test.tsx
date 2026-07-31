import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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

    const main = screen.getByRole("main");
    expect(main).toBeInTheDocument();
    expect(main).toHaveTextContent("Content");
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
