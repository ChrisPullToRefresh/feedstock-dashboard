import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "@/components/ui/button";

/**
 * Proves shadcn/ui is wired: its variant classes reach the rendered DOM,
 * which means Tailwind and the theme tokens are in the chain.
 */
describe("Button", () => {
  it("applies the default variant classes", () => {
    render(<Button>Record movement</Button>);

    const button = screen.getByRole("button", { name: "Record movement" });

    expect(button).toHaveClass("bg-primary", "text-primary-foreground");
    expect(button).toHaveAttribute("data-variant", "default");
  });

  it("applies the outline variant classes instead of the default ones", () => {
    render(<Button variant="outline">Cancel</Button>);

    const button = screen.getByRole("button", { name: "Cancel" });

    expect(button).toHaveClass("border-border", "bg-background");
    expect(button).not.toHaveClass("bg-primary");
    expect(button).toHaveAttribute("data-variant", "outline");
  });

  it("applies the size variant classes", () => {
    render(<Button size="lg">Save</Button>);

    const button = screen.getByRole("button", { name: "Save" });

    expect(button).toHaveClass("h-9");
    expect(button).toHaveAttribute("data-size", "lg");
  });
});
