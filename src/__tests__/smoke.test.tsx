import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

// Tooling proof for Vitest + RTL wiring (Group 2). Delete once Group 5's
// real shell component test lands.
function Placeholder() {
  return <h1>Feedstock Dashboard</h1>;
}

describe("Vitest + RTL tooling smoke test", () => {
  it("renders a heading", () => {
    render(<Placeholder />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Feedstock Dashboard" })
    ).toBeInTheDocument();
  });
});
