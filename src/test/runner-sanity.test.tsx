import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

/**
 * Proves Vitest and React Testing Library both execute, here and in CI.
 * Without a test that always runs, a CI run that silently discovers no
 * tests looks green.
 */
function Greeting({ name }: { name: string }) {
  return <p>Hello, {name}.</p>;
}

describe("test runner", () => {
  it("renders a component and asserts on its output", () => {
    render(<Greeting name="operator" />);

    expect(screen.getByText("Hello, operator.")).toBeInTheDocument();
  });
});
